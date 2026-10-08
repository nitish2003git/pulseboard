import mongoose from 'mongoose';

/**
 * A single event in a board's activity feed.
 * `type` drives the icon/label rendered on the client.
 */
const activitySchema = new mongoose.Schema(
  {
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'task_created',
        'task_moved',
        'task_updated',
        'task_deleted',
        'task_assigned',
        'comment_added',
        'member_joined',
        'member_added',
        'board_created',
      ],
    },
    // Denormalized snapshot so the feed reads well without extra lookups.
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ board: 1, createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
