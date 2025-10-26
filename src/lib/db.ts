"use server";
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://alon-unit-team500:a1994a@cluster0.h5cpou0.mongodb.net/team-500?retryWrites=true&tlsAllowInvalidCertificates=true&w=majority&appName=Cluster0/team500'; // תגדיר בקובץ .env.local

if (!MONGO_URI) throw new Error('Missing MONGO_URI in env');

const cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectToDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    }).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}