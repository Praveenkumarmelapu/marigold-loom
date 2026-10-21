const mongoose = require('mongoose');
const env = require('./env');

// Cache the connection across serverless invocations.
let cached = global.__mongoose;
if (!cached) cached = global.__mongoose = { conn: null, promise: null };

async function connectDB() {
  if (!env.mongoUri) throw new Error('MONGODB_URI is not set');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose
      .connect(env.mongoUri, { serverSelectionTimeoutMS: 8000, bufferCommands: false })
      .then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

module.exports = connectDB;
