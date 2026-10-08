import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { updateTask, moveTask, deleteTask } from '../controllers/task.controller.js';
import { listComments, addComment } from '../controllers/comment.controller.js';

const router = Router();
router.use(protect);

router.route('/:id').put(updateTask).delete(deleteTask);
router.patch('/:id/move', moveTask);

router.route('/:taskId/comments').get(listComments).post(addComment);

export default router;
