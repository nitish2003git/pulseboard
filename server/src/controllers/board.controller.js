import { asyncHandler } from '../middleware/auth.js';
import Board from '../models/Board.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Comment from '../models/Comment.js';
import { logActivity, notify } from '../utils/events.js';
import { emitToBoard } from '../socket/index.js';

const memberSelect = 'name email avatarColor role';

async function loadBoardOr404(id, res) {
  const board = await Board.findById(id)
    .populate('owner', memberSelect)
    .populate('members.user', memberSelect);
  if (!board) {
    res.status(404);
    throw new Error('Board not found');
  }
  return board;
}

// GET /api/boards — every board the user owns or belongs to
export const listBoards = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const boards = await Board.find({ $or: [{ owner: uid }, { 'members.user': uid }] })
    .populate('owner', memberSelect)
    .populate('members.user', memberSelect)
    .sort('-updatedAt');

  // Attach a lightweight task count for each board card.
  const withCounts = await Promise.all(
    boards.map(async (b) => {
      const taskCount = await Task.countDocuments({ board: b._id });
      const doneCount = await Task.countDocuments({ board: b._id, status: 'done' });
      return { ...b.toObject(), taskCount, doneCount, myRole: b.membership(uid)?.role };
    })
  );
  res.json({ boards: withCounts });
});

// POST /api/boards
export const createBoard = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;
  if (!name?.trim()) {
    res.status(400);
    throw new Error('Board name is required');
  }

  const board = await Board.create({
    name: name.trim(),
    description: description?.trim() || '',
    color: color || '#6366f1',
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'admin' }],
  });

  await logActivity({
    board: board._id,
    actor: req.user._id,
    type: 'board_created',
    meta: { boardName: board.name },
  });

  const populated = await loadBoardOr404(board._id, res);
  res.status(201).json({ board: populated });
});

// GET /api/boards/:id — full board with tasks
export const getBoard = asyncHandler(async (req, res) => {
  const board = await loadBoardOr404(req.params.id, res);
  if (!board.isMember(req.user._id)) {
    res.status(403);
    throw new Error('You are not a member of this board');
  }

  const tasks = await Task.find({ board: board._id })
    .populate('assignee', memberSelect)
    .populate('createdBy', memberSelect)
    .sort('order');

  res.json({ board, tasks, myRole: board.membership(req.user._id).role });
});

// PUT /api/boards/:id — board admins only
export const updateBoard = asyncHandler(async (req, res) => {
  const board = await loadBoardOr404(req.params.id, res);
  if (!board.isBoardAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Only board admins can edit board settings');
  }

  const { name, description, color, columns } = req.body;
  if (name !== undefined) board.name = name.trim();
  if (description !== undefined) board.description = description.trim();
  if (color !== undefined) board.color = color;
  if (Array.isArray(columns) && columns.length) board.columns = columns;
  await board.save();

  emitToBoard(String(board._id), 'board:updated', board);
  res.json({ board });
});

// DELETE /api/boards/:id — owner only
export const deleteBoard = asyncHandler(async (req, res) => {
  const board = await loadBoardOr404(req.params.id, res);
  if (String(board.owner._id) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only the board owner can delete this board');
  }

  await Promise.all([
    Task.deleteMany({ board: board._id }),
    Comment.deleteMany({ board: board._id }),
    Activity.deleteMany({ board: board._id }),
  ]);
  await board.deleteOne();

  emitToBoard(String(board._id), 'board:deleted', { boardId: board._id });
  res.json({ message: 'Board deleted' });
});

// POST /api/boards/join  { inviteCode }
export const joinBoard = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode?.trim()) {
    res.status(400);
    throw new Error('An invite code is required');
  }

  const board = await Board.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
  if (!board) {
    res.status(404);
    throw new Error('No board found for that invite code');
  }
  if (board.isMember(req.user._id)) {
    const populated = await loadBoardOr404(board._id, res);
    return res.json({ board: populated, alreadyMember: true });
  }

  board.members.push({ user: req.user._id, role: 'member' });
  await board.save();

  await logActivity({
    board: board._id,
    actor: req.user._id,
    type: 'member_joined',
    meta: { name: req.user.name },
  });

  const populated = await loadBoardOr404(board._id, res);
  emitToBoard(String(board._id), 'board:member-added', { board: populated });
  res.json({ board: populated });
});

// POST /api/boards/:id/members  { email, role }  — board admins
export const addMember = asyncHandler(async (req, res) => {
  const board = await loadBoardOr404(req.params.id, res);
  if (!board.isBoardAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Only board admins can add members');
  }

  const { email, role = 'member' } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('No user found with that email');
  }
  if (board.isMember(user._id)) {
    res.status(409);
    throw new Error('That user is already a member');
  }

  board.members.push({ user: user._id, role: role === 'admin' ? 'admin' : 'member' });
  await board.save();

  await logActivity({
    board: board._id,
    actor: req.user._id,
    type: 'member_added',
    meta: { name: user.name },
  });
  await notify({
    user: user._id,
    board: board._id,
    actor: req.user._id,
    type: 'member_added',
    message: `${req.user.name} added you to “${board.name}”`,
    link: `/boards/${board._id}`,
  });

  const populated = await loadBoardOr404(board._id, res);
  emitToBoard(String(board._id), 'board:member-added', { board: populated });
  res.json({ board: populated });
});

// PATCH /api/boards/:id/members/:userId  { role }
export const updateMemberRole = asyncHandler(async (req, res) => {
  const board = await loadBoardOr404(req.params.id, res);
  if (!board.isBoardAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Only board admins can change roles');
  }
  if (String(board.owner._id) === String(req.params.userId)) {
    res.status(400);
    throw new Error("The board owner's role cannot be changed");
  }

  const member = board.members.find((m) => String(m.user._id) === String(req.params.userId));
  if (!member) {
    res.status(404);
    throw new Error('That user is not a member of this board');
  }
  member.role = req.body.role === 'admin' ? 'admin' : 'member';
  await board.save();

  const populated = await loadBoardOr404(board._id, res);
  emitToBoard(String(board._id), 'board:updated', populated);
  res.json({ board: populated });
});

// DELETE /api/boards/:id/members/:userId
export const removeMember = asyncHandler(async (req, res) => {
  const board = await loadBoardOr404(req.params.id, res);
  const targetId = req.params.userId;
  const isSelf = String(targetId) === String(req.user._id);

  if (!board.isBoardAdmin(req.user._id) && !isSelf) {
    res.status(403);
    throw new Error('Only board admins can remove other members');
  }
  if (String(board.owner._id) === String(targetId)) {
    res.status(400);
    throw new Error('The board owner cannot be removed');
  }

  board.members = board.members.filter((m) => String(m.user._id) !== String(targetId));
  await board.save();

  const populated = await loadBoardOr404(board._id, res);
  emitToBoard(String(board._id), 'board:updated', populated);
  res.json({ board: populated });
});
