import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
import { emitToBoard, emitToUser } from '../socket/index.js';

/**
 * Record an event on a board's activity feed and broadcast it live to
 * everyone viewing that board.
 */
export async function logActivity({ board, actor, type, meta = {} }) {
  const activity = await Activity.create({ board, actor, type, meta });
  const populated = await activity.populate('actor', 'name avatarColor email');
  emitToBoard(String(board), 'activity:new', populated);
  return populated;
}

/**
 * Create an in-app notification for a user and push it to them in real time.
 * Never notifies a user about their own action.
 */
export async function notify({ user, board, actor, type, message, link = '' }) {
  if (String(user) === String(actor)) return null;
  const notification = await Notification.create({ user, board, actor, type, message, link });
  const populated = await notification.populate('actor', 'name avatarColor');
  emitToUser(String(user), 'notification:new', populated);
  return populated;
}
