import { asyncHandler } from '../middleware/auth.js';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import Comment from '../models/Comment.js';
import { logActivity, notify } from '../utils/events.js';
import { emitToBoard } from '../socket/index.js';

const memberSelect = 'name email avatarColor role';

async function loadBoardMember(boardId, user, res) {
  const board = await Board.findById(boardId);
  if (!board) {
    res.status(404);
    throw new Error('Board not found');
  }
  if (!board.isMember(user._id)) {
    res.status(403);
    throw new Error('You are not a member of this board');
  }
  return board;
}

function populateTask(query) {
  return query.populate('assignee', memberSelect).populate('createdBy', memberSelect);
}

// POST /api/boards/:boardId/tasks
export const createTask = asyncHandler(async (req, res) => {
  const board = await loadBoardMember(req.params.boardId, req.user, res);
  const { title, description, status, priority, assignee, labels, dueDate } = req.body;
  if (!title?.trim()) {
    res.status(400);
    throw new Error('Task title is required');
  }

  const columnKey = status && board.columns.some((c) => c.key === status) ? status : board.columns[0].key;
  // New cards go to the top of their column.
  const first = await Task.findOne({ board: board._id, status: columnKey }).sort('order');
  const order = first ? first.order - 1000 : 1000;

  let task = await Task.create({
    board: board._id,
    title: title.trim(),
    description: description?.trim() || '',
    status: columnKey,
    priority: priority || 'medium',
    assignee: assignee || null,
    labels: Array.isArray(labels) ? labels : [],
    dueDate: dueDate || null,
    createdBy: req.user._id,
    order,
  });
  task = await populateTask(Task.findById(task._id));

  emitToBoard(String(board._id), 'task:created', task);
  await logActivity({
    board: board._id,
    actor: req.user._id,
    type: 'task_created',
    meta: { taskId: task._id, title: task.title, status: columnKey },
  });

  if (task.assignee && String(task.assignee._id) !== String(req.user._id)) {
    await notify({
      user: task.assignee._id,
      board: board._id,
      actor: req.user._id,
      type: 'task_assigned',
      message: `${req.user.name} assigned you “${task.title}”`,
      link: `/boards/${board._id}`,
    });
  }

  res.status(201).json({ task });
});

// PUT /api/tasks/:id  — edit fields
export const updateTask = asyncHandler(async (req, res) => {
  const existing = await Task.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error('Task not found');
  }
  const board = await loadBoardMember(existing.board, req.user, res);

  const { title, description, priority, assignee, labels, dueDate } = req.body;
  const prevAssignee = existing.assignee ? String(existing.assignee) : null;

  if (title !== undefined) existing.title = title.trim();
  if (description !== undefined) existing.description = description.trim();
  if (priority !== undefined) existing.priority = priority;
  if (labels !== undefined) existing.labels = Array.isArray(labels) ? labels : [];
  if (dueDate !== undefined) existing.dueDate = dueDate || null;
  if (assignee !== undefined) existing.assignee = assignee || null;
  await existing.save();

  const task = await populateTask(Task.findById(existing._id));
  emitToBoard(String(board._id), 'task:updated', task);
  await logActivity({
    board: board._id,
    actor: req.user._id,
    type: 'task_updated',
    meta: { taskId: task._id, title: task.title },
  });

  // Notify a newly-assigned user.
  const newAssignee = task.assignee ? String(task.assignee._id) : null;
  if (newAssignee && newAssignee !== prevAssignee) {
    await logActivity({
      board: board._id,
      actor: req.user._id,
      type: 'task_assigned',
      meta: { taskId: task._id, title: task.title, assignee: task.assignee.name },
    });
    await notify({
      user: newAssignee,
      board: board._id,
      actor: req.user._id,
      type: 'task_assigned',
      message: `${req.user.name} assigned you “${task.title}”`,
      link: `/boards/${board._id}`,
    });
  }

  res.json({ task });
});

// PATCH /api/tasks/:id/move  { status, order }  — drag & drop
export const moveTask = asyncHandler(async (req, res) => {
  const existing = await Task.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error('Task not found');
  }
  const board = await loadBoardMember(existing.board, req.user, res);

  const { status, order } = req.body;
  const fromStatus = existing.status;
  if (status && !board.columns.some((c) => c.key === status)) {
    res.status(400);
    throw new Error('Unknown column');
  }

  if (status) existing.status = status;
  if (typeof order === 'number') existing.order = order;
  await existing.save();

  const task = await populateTask(Task.findById(existing._id));
  // Broadcast to the whole board room so every open client re-orders instantly.
  emitToBoard(String(board._id), 'task:moved', {
    task,
    from: fromStatus,
    to: task.status,
    movedBy: { id: String(req.user._id), name: req.user.name },
  });

  // Only log an activity when the column actually changed (not for reordering).
  if (status && status !== fromStatus) {
    const toTitle = board.columns.find((c) => c.key === status)?.title || status;
    await logActivity({
      board: board._id,
      actor: req.user._id,
      type: 'task_moved',
      meta: { taskId: task._id, title: task.title, from: fromStatus, to: status, toTitle },
    });
    // Tell the task's assignee their card changed status.
    if (task.assignee && String(task.assignee._id) !== String(req.user._id)) {
      await notify({
        user: task.assignee._id,
        board: board._id,
        actor: req.user._id,
        type: 'status_changed',
        message: `${req.user.name} moved “${task.title}” to ${toTitle}`,
        link: `/boards/${board._id}`,
      });
    }
  }

  res.json({ task });
});

// DELETE /api/tasks/:id
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  const board = await loadBoardMember(task.board, req.user, res);

  const isCreator = String(task.createdBy) === String(req.user._id);
  if (!isCreator && !board.isBoardAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Only the task creator or a board admin can delete this task');
  }

  await Comment.deleteMany({ task: task._id });
  await task.deleteOne();

  emitToBoard(String(board._id), 'task:deleted', { taskId: task._id, status: task.status });
  await logActivity({
    board: board._id,
    actor: req.user._id,
    type: 'task_deleted',
    meta: { title: task.title },
  });

  res.json({ message: 'Task deleted', taskId: task._id });
});
