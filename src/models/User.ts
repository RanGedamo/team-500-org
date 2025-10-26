import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['admin', 'user', 'teamLead', 'deputyLead', 'scheduler', 'logistics', 'guard'],
    default: 'user'
  },
  profile: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, versionKey: false });


export default mongoose.models?.User || mongoose.model('User', UserSchema);