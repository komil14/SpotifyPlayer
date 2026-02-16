import mongoose, { Document, Schema } from "mongoose";

// 1. Create the Interface (Types)
export interface ILyric extends Document {
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  isManual?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Schema (Database Rules)
const LyricSchema: Schema = new Schema(
  {
    spotifyTrackId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    trackName: {
      type: String,
      required: true,
    },
    artistName: {
      type: String,
      required: true,
    },
    syncedLyrics: {
      type: String,
      default: null,
    },
    plainLyrics: {
      type: String,
      default: null,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// 3. Export the Model
export default mongoose.model<ILyric>("Lyric", LyricSchema);
