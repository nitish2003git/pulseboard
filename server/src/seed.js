import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Board from './models/Board.js';
import Task from './models/Task.js';
import Activity from './models/Activity.js';
import Comment from './models/Comment.js';
import Notification from './models/Notification.js';

/**
 * Wipes the database and inserts a small, realistic demo dataset.
 * Run with:  npm run seed
 *
 * Demo logins (all password: password123):
 *   admin@pulseboard.dev   (Admin — board owner)
 *   maya@pulseboard.dev    (Member)
 *   dev@pulseboard.dev     (Member)
 */
async function seed() {
  await connectDB();
  console.log('Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Board.deleteMany({}),
    Task.deleteMany({}),
    Activity.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('Creating users…');
  const admin = await User.create({ name: 'Alex Rivera', email: 'admin@pulseboard.dev', password: 'password123', role: 'admin' });
  const maya = await User.create({ name: 'Maya Chen', email: 'maya@pulseboard.dev', password: 'password123', role: 'member' });
  const dev = await User.create({ name: 'Jordan Lee', email: 'dev@pulseboard.dev', password: 'password123', role: 'member' });

  console.log('Creating board…');
  const board = await Board.create({
    name: 'Product Launch — Q3',
    description: 'Everything we need to ship PulseBoard 1.0 to the world.',
    color: '#6366f1',
    owner: admin._id,
    members: [
      { user: admin._id, role: 'admin' },
      { user: maya._id, role: 'member' },
      { user: dev._id, role: 'member' },
    ],
  });

  console.log('Creating tasks…');
  const seedTasks = [
    { title: 'Finalize landing page copy', status: 'todo', priority: 'high', assignee: maya._id, labels: ['marketing'], desc: 'Tighten the hero section and CTA wording.' },
    { title: 'Set up MongoDB Atlas cluster', status: 'todo', priority: 'urgent', assignee: dev._id, labels: ['infra'], desc: 'Free M0 tier, add network access + DB user.' },
    { title: 'Design dark-mode palette', status: 'todo', priority: 'medium', assignee: admin._id, labels: ['design'] },
    { title: 'Build Kanban drag & drop', status: 'in_progress', priority: 'high', assignee: dev._id, labels: ['frontend'], desc: 'Use @hello-pangea/dnd with optimistic updates.' },
    { title: 'JWT auth + protected routes', status: 'in_progress', priority: 'high', assignee: admin._id, labels: ['backend', 'security'] },
    { title: 'Socket.io board rooms', status: 'review', priority: 'medium', assignee: dev._id, labels: ['realtime'], desc: 'Broadcast task moves to everyone on the board.' },
    { title: 'Write API documentation', status: 'review', priority: 'low', assignee: maya._id, labels: ['docs'] },
    { title: 'Project scaffolding', status: 'done', priority: 'medium', assignee: admin._id, labels: ['setup'] },
    { title: 'Choose classic color system', status: 'done', priority: 'low', assignee: maya._id, labels: ['design'] },
  ];

  let order = 1000;
  const created = [];
  for (const t of seedTasks) {
    const task = await Task.create({
      board: board._id,
      title: t.title,
      description: t.desc || '',
      status: t.status,
      priority: t.priority,
      assignee: t.assignee,
      labels: t.labels || [],
      createdBy: admin._id,
      order: (order += 1000),
    });
    created.push(task);
  }

  console.log('Creating activity + a comment…');
  await Activity.create([
    { board: board._id, actor: admin._id, type: 'board_created', meta: { boardName: board.name } },
    { board: board._id, actor: dev._id, type: 'task_created', meta: { title: 'Build Kanban drag & drop' } },
    { board: board._id, actor: dev._id, type: 'task_moved', meta: { title: 'Socket.io board rooms', from: 'in_progress', to: 'review', toTitle: 'Review' } },
    { board: board._id, actor: maya._id, type: 'member_joined', meta: { name: 'Maya Chen' } },
  ]);

  const reviewTask = created.find((t) => t.title.includes('Socket.io'));
  const comment = await Comment.create({
    task: reviewTask._id,
    board: board._id,
    author: admin._id,
    body: 'Looks great — can we add presence indicators too?',
  });
  reviewTask.commentCount = 1;
  await reviewTask.save();
  await Activity.create({ board: board._id, actor: admin._id, type: 'comment_added', meta: { title: reviewTask.title, excerpt: comment.body } });

  console.log('\n✓ Seed complete!');
  console.log('  Demo logins (password: password123):');
  console.log('    admin@pulseboard.dev  — Alex Rivera (Admin)');
  console.log('    maya@pulseboard.dev   — Maya Chen (Member)');
  console.log('    dev@pulseboard.dev    — Jordan Lee (Member)\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
