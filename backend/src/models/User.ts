import mongoose, { Document, Schema } from 'mongoose';

// 1. Create the Interface (Types)
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  createdAt: Date;
}

// 2. Create the Schema (Database Rules)
const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true, // '  Test@Email.com ' -> 'Test@Email.com'
  },
  passwordHash: {
    type: String,
    required: true,
  },
  // We will store these later during Phase 3
  spotifyAccessToken: { type: String },
  spotifyRefreshToken: { type: String },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// 3. Export the Model
export default mongoose.model<IUser>('User', UserSchema);