import { Server } from 'socket.io';
import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';
import Board from '../models/Board.js';

let io = null;

/**
 * Attach Socket.io to the HTTP server.
 * - Authenticates each socket with the same JWT used by the REST API.
 * - Puts every user in a personal room `user:<id>` for notifications.
 * - Lets clients join/leave per-board rooms `board:<id>` so task updates
 *   are only broadcast to people currently viewing that board.
 */
export function initSocket(httpServer, corsOrigin) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  // Authenticate the handshake.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No auth token'));
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('name email avatarColor role');
      if (!user) return next(new Error('User not found'));
      socket.user = { id: String(user._id), name: user.name, avatarColor: user.avatarColor };
      next();
    } catch {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on('board:join', async (boardId) => {
      try {
        const board = await Board.findById(boardId);
        if (board && board.isMember(socket.user.id)) {
          socket.join(`board:${boardId}`);

          // Send the joiner the list of everyone currently viewing this board.
          const sockets = await io.in(`board:${boardId}`).fetchSockets();
          const seen = new Set();
          const present = [];
          for (const s of sockets) {
            if (s.user && !seen.has(s.user.id)) {
              seen.add(s.user.id);
              present.push(s.user);
            }
          }
          socket.emit('presence:sync', present);

          // Let others know who just arrived (lightweight presence).
          socket.to(`board:${boardId}`).emit('presence:join', socket.user);
        }
      } catch {
        /* ignore malformed ids */
      }
    });

    socket.on('board:leave', (boardId) => {
      socket.leave(`board:${boardId}`);
      socket.to(`board:${boardId}`).emit('presence:leave', socket.user);
    });

    // Broadcast transient "typing / dragging" cues without hitting the DB.
    socket.on('task:dragging', ({ boardId, taskId }) => {
      if (boardId) socket.to(`board:${boardId}`).emit('task:dragging', { taskId, user: socket.user });
    });
  });

  console.log('✓ Socket.io ready');
  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
}

/** Broadcast an event to everyone currently viewing a board. */
export function emitToBoard(boardId, event, payload) {
  if (io) io.to(`board:${boardId}`).emit(event, payload);
}

/** Send an event to a specific user across all their devices/tabs. */
export function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${userId}`).emit(event, payload);
}
