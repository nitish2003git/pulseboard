import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    // Global platform role. Board-level roles live on the Board membership.
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    avatarColor: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
);

// Hash the password whenever it is set/changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

// Never leak the hash even if `select:false` is bypassed.
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// A small deterministic avatar palette so members get consistent colors.
const PALETTE = ['#6366f1', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981'];
userSchema.pre('validate', function assignColor(next) {
  if (this.isNew && !this.avatarColor) {
    const idx = Math.abs([...(this.email || '')].reduce((a, c) => a + c.charCodeAt(0), 0)) % PALETTE.length;
    this.avatarColor = PALETTE[idx];
  }
  next();
});

export default mongoose.model('User', userSchema);
