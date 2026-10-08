import { asyncHandler } from '../middleware/auth.js';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import Comment from '../models/Comment.js';
import { logActivity, notify } from '../utils/events.js';
import { emitToBoard } from '../socket/index.js';

// GET /api/tasks/:taskId/comments
export const listComments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  const board = await Board.findById(task.board);
  if (!board?.isMember(req.user._id)) {
    res.status(403);
    throw new Error('You are not a member of this board');
  }

  const comments = await Comment.find({ task: task._id })
    .populate('author', 'name email avatarColor')
    .sort('createdAt');
  res.json({ comments });
});

// POST /api/tasks/:taskId/comments  { body }
export const addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId).populate('assignee', 'name');
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  const board = await Board.findById(task.board);
  if (!board?.isMember(req.user._id)) {
    res.status(403);
    throw new Error('You are not a member of this board');
  }
  if (!req.body.body?.trim()) {
    res.status(400);
    throw new Error('Comment cannot be empty');
  }

  let comment = await Comment.create({
    task: task._id,
    board: board._id,
    author: req.user._id,
    body: req.body.body.trim(),
  });
  comment = await comment.populate('author', 'name email avatarColor');

  task.commentCount += 1;
  await task.save();

  emitToBoard(String(board._id), 'comment:added', { comment, taskId: String(task._id), commentCount: task.commentCount });
  await logActivity({
    board: board._id,
    actor: req.user._id,
    type: 'comment_added',
    meta: { taskId: task._id, title: task.title, excerpt: comment.body.slice(0, 80) },
  });

  // Notify the assignee that someone commented on their task.
  if (task.assignee && String(task.assignee._id) !== String(req.user._id)) {
    await notify({
      user: task.assignee._id,
      board: board._id,
      actor: req.user._id,
      type: 'comment_added',
      message: `${req.user.name} commented on “${task.title}”`,
      link: `/boards/${board._id}`,
    });
  }

  res.status(201).json({ comment });
});
