// models/userProfile.ts
import mongoose, { Schema } from 'mongoose';

import { v4 as uuidv4 } from 'uuid';

const UserProfileSchema = new Schema({
  fullName: { type: String, required: true, trim: true },

  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },

  status: {
    type: String,
    enum: ['active', 'reservist', 'vacation', 'inactive', 'sick'],
    default: 'active'
  },

  calendarUuid: { type: String, default: uuidv4 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  versionKey: false
});

UserProfileSchema.index({ userId: 1 }, { unique: true });

UserProfileSchema.virtual('calendarLinks').get(function () {
  const BASE = process.env.BASE_URL || 'http://localhost:3000';
  const feed = `${BASE}/api/calendar/${this.calendarUuid}.ics`;

  return {
    google: `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(feed)}`,
    ios: feed.replace(/^https?:\/\//, 'webcal://')
  };
});

UserProfileSchema.set('toJSON', { virtuals: true });
UserProfileSchema.set('toObject', { virtuals: true });

export default mongoose.models?.UserProfile || mongoose.model('UserProfile', UserProfileSchema);