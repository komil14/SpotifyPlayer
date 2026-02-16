import { Request, Response } from "express";
import Favorite from "../models/Favorite";

// @desc    Add a track to favorites
// @route   POST /api/favorites
export const addFavorite = async (req: Request, res: Response) => {
  const {
    userId,
    spotifyTrackId,
    trackName,
    artistName,
    albumName,
    albumArt,
    trackUri,
    durationMs,
  } = req.body;

  if (!userId || !spotifyTrackId || !trackName || !artistName) {
    res.status(400).json({
      message: "userId, spotifyTrackId, trackName, and artistName are required",
    });
    return;
  }

  try {
    // Upsert — won't duplicate if already favorited
    const favorite = await Favorite.findOneAndUpdate(
      { userId, spotifyTrackId },
      {
        userId,
        spotifyTrackId,
        trackName,
        artistName,
        albumName: albumName || "",
        albumArt: albumArt || "",
        trackUri: trackUri || "",
        durationMs: durationMs || 0,
      },
      { upsert: true, new: true },
    );

    res.status(201).json(favorite);
  } catch (error: any) {
    console.error("Add Favorite Error:", error.message);
    res.status(500).json({ message: "Failed to add favorite" });
  }
};

// @desc    Remove a track from favorites
// @route   DELETE /api/favorites/:trackId
export const removeFavorite = async (req: Request, res: Response) => {
  const { trackId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    const result = await Favorite.findOneAndDelete({
      userId,
      spotifyTrackId: trackId,
    });

    if (!result) {
      res.status(404).json({ message: "Favorite not found" });
      return;
    }

    res.json({ message: "Removed from favorites" });
  } catch (error: any) {
    console.error("Remove Favorite Error:", error.message);
    res.status(500).json({ message: "Failed to remove favorite" });
  }
};

// @desc    Get all favorites for a user
// @route   GET /api/favorites
export const getFavorites = async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error: any) {
    console.error("Get Favorites Error:", error.message);
    res.status(500).json([]);
  }
};

// @desc    Check if a track is favorited
// @route   GET /api/favorites/check/:trackId
export const checkFavorite = async (req: Request, res: Response) => {
  const { trackId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    const exists = await Favorite.exists({ userId, spotifyTrackId: trackId });
    res.json({ isFavorited: !!exists });
  } catch (error: any) {
    console.error("Check Favorite Error:", error.message);
    res.status(500).json({ isFavorited: false });
  }
};
