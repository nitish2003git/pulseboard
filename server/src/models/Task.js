import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    // Matches a Board column `key`.
    status: { type: String, required: true, default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    // Fractional/relative index used to order cards inside a column.
    order: { type: Number, default: 1000 },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    labels: { type: [String], default: [] },
    dueDate: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ board: 1, status: 1, order: 1 });

export default mongoose.model('Task', taskSchema);
