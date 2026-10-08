import { io } from 'socket.io-client';

// One shared socket for the whole app. Connect lazily once we have a token.
const URL = import.meta.env.VITE_API_URL || '/';

let socket = null;

export function connectSocket(token) {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
