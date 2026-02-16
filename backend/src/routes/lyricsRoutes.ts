import express from "express";
import {
  getTrackLyrics,
  getLyricById,
  addManualSong,
  getAllCachedSongs,
} from "../controllers/lyricsController";

const router = express.Router();

// Get lyrics for a specific track (by query params)
router.get("/", getTrackLyrics);

// Add a manual song (without lyrics)
router.post("/manual", addManualSong);

// Get all cached songs
router.get("/all", getAllCachedSongs);

// Get a specific lyric by MongoDB ID
router.get("/:id", getLyricById);

export default router;
