import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

// Human-friendly invite code, e.g. "PB-7GQ2KX".
const nano = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Per-board role — independent of the user's global role.
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { _id: false }
);

// Default columns every new board starts with.
const columnSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // stable id used by tasks
    title: { type: String, required: true },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 280, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
    columns: {
      type: [columnSchema],
      default: () => [
        { key: 'todo', title: 'To Do' },
        { key: 'in_progress', title: 'In Progress' },
        { key: 'review', title: 'Review' },
        { key: 'done', title: 'Done' },
      ],
    },
    inviteCode: { type: String, unique: true, index: true },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
);

boardSchema.pre('validate', function setInvite(next) {
  if (this.isNew && !this.inviteCode) this.inviteCode = `PB-${nano()}`;
  next();
});

// Helpers used throughout the controllers for permission checks.
boardSchema.methods.membership = function membership(userId) {
  const id = String(userId);
  if (String(this.owner) === id) return { role: 'admin', isOwner: true };
  const m = this.members.find((mm) => String(mm.user?._id || mm.user) === id);
  return m ? { role: m.role, isOwner: false } : null;
};

boardSchema.methods.isMember = function isMember(userId) {
  return this.membership(userId) !== null;
};

boardSchema.methods.isBoardAdmin = function isBoardAdmin(userId) {
  const m = this.membership(userId);
  return m !== null && m.role === 'admin';
};

export default mongoose.model('Board', boardSchema);
