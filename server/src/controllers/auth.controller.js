import { asyncHandler } from '../middleware/auth.js';
import User from '../models/User.js';
import { signToken } from '../utils/token.js';

function shape(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarColor: user.avatarColor,
  };
}

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are all required');
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error('An account with that email already exists');
  }

  // First user to ever register becomes a platform admin — convenient for demos.
  const isFirstUser = (await User.estimatedDocumentCount()) === 0;
  const user = await User.create({
    name,
    email,
    password,
    role: isFirstUser ? 'admin' : 'member',
  });

  res.status(201).json({ token: signToken(user._id), user: shape(user) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({ token: signToken(user._id), user: shape(user) });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: shape(req.user) });
});

// GET /api/auth/users  — used for assignee pickers
export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('name email avatarColor role').sort('name');
  res.json({ users });
});
