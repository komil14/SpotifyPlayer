import mongoose, { Document, Schema } from "mongoose";

export interface IListeningHistory extends Document {
  userId: mongoose.Types.ObjectId;
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumArt: string;
  durationMs: number;
  playedAt: Date;
}

const ListeningHistorySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  spotifyTrackId: {
    type: String,
    required: true,
  },
  trackName: {
    type: String,
    required: true,
  },
  artistName: {
    type: String,
    required: true,
  },
  albumArt: {
    type: String,
    default: "",
  },
  durationMs: {
    type: Number,
    default: 0,
  },
  playedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient analytics queries
ListeningHistorySchema.index({ userId: 1, playedAt: -1 });
ListeningHistorySchema.index({ userId: 1, artistName: 1 });

export default mongoose.model<IListeningHistory>(
  "ListeningHistory",
  ListeningHistorySchema,
);
