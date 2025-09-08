// backend/config/db.js
import mongoose from 'mongoose';

// Module-scoped state = single shared instance for the whole process
let isConnected = false;

/**
 * Singleton DB connector.
 * First call connects and caches the connection.
 * Later calls return immediately without opening a new connection.
 */
export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');

  if (isConnected) {
    // Already connected; return the existing connection
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, { autoIndex: true });
  isConnected = true;

  // Optional: a few helpful listeners (not required for the assignment)
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('MongoDB disconnected');
  });

  console.log('MongoDB connected (singleton)');
  return mongoose.connection;
}
