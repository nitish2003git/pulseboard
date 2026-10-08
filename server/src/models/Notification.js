import mongoose from 'mongoose';

/**
 * Per-user in-app notification. Created when something relevant happens
 * to a user (e.g. a task is assigned to them or someone comments on their task).
 */
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      required: true,
      enum: ['task_assigned', 'status_changed', 'comment_added', 'member_added'],
    },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // client route, e.g. /boards/:id
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
