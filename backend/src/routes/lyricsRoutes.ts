import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getTrackLyrics,
  getLyricById,
  addManualSong,
  getAllCachedSongs,
} from "../controllers/lyricsController";

const router = express.Router();

// Get lyrics for a specific track (by query params)
router.get("/", getTrackLyrics);

// Get all cached songs
router.get("/all", getAllCachedSongs);

// Get a specific lyric by MongoDB ID
router.get("/:id", getLyricById);

// Add a manual song (without lyrics)
router.post("/manual", protect, addManualSong);

export default router;
