import mongoose, { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArt: string;
  trackUri: string;
  durationMs: number;
  createdAt: Date;
}

const FavoriteSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    albumName: {
      type: String,
      default: "",
    },
    albumArt: {
      type: String,
      default: "",
    },
    trackUri: {
      type: String,
      default: "",
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index: one user can only favorite a track once
FavoriteSchema.index({ userId: 1, spotifyTrackId: 1 }, { unique: true });

export default mongoose.model<IFavorite>("Favorite", FavoriteSchema);
