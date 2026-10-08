import { asyncHandler } from '../middleware/auth.js';
import Board from '../models/Board.js';
import Activity from '../models/Activity.js';

// GET /api/boards/:boardId/activity?limit=30
export const listActivity = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.boardId);
  if (!board) {
    res.status(404);
    throw new Error('Board not found');
  }
  if (!board.isMember(req.user._id)) {
    res.status(403);
    throw new Error('You are not a member of this board');
  }

  const limit = Math.min(Number(req.query.limit) || 40, 100);
  const activity = await Activity.find({ board: board._id })
    .populate('actor', 'name avatarColor email')
    .sort('-createdAt')
    .limit(limit);

  res.json({ activity });
});
