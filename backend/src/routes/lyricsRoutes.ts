import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getTrackLyrics,
  getLyricById,
  addManualSong,
  getAllCachedSongs,
} from "../controllers/lyricsController";

const router = express.Router();

router.use(protect);

// Get lyrics for a specific track (by query params)
router.get("/", getTrackLyrics);

// Add a manual song (without lyrics)
router.post("/manual", addManualSong);

// Get all cached songs
router.get("/all", getAllCachedSongs);

// Get a specific lyric by MongoDB ID
router.get("/:id", getLyricById);

export default router;
