import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  joinBoard,
  addMember,
  updateMemberRole,
  removeMember,
} from '../controllers/board.controller.js';
import { createTask } from '../controllers/task.controller.js';
import { listActivity } from '../controllers/activity.controller.js';

const router = Router();
router.use(protect); // every board route requires auth

router.route('/').get(listBoards).post(createBoard);
router.post('/join', joinBoard);

router.route('/:id').get(getBoard).put(updateBoard).delete(deleteBoard);

router.post('/:id/members', addMember);
router.route('/:id/members/:userId').patch(updateMemberRole).delete(removeMember);

// Nested task + activity resources scoped to a board.
router.post('/:boardId/tasks', createTask);
router.get('/:boardId/activity', listActivity);

export default router;
