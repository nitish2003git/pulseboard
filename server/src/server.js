import 'dotenv/config';
import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket/index.js';

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const origins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
  initSocket(server, origins);

  server.listen(PORT, () => {
    console.log(`\n🚀 PulseBoard API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
