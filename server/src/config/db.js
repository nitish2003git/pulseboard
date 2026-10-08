import mongoose from 'mongoose';

/**
 * Connect to MongoDB. The connection string comes from MONGODB_URI.
 * For local dev use mongodb://127.0.0.1:27017/pulseboard,
 * for production use a free MongoDB Atlas cluster URI.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✓ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => console.warn('⚠ MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('✓ MongoDB reconnected'));
}
