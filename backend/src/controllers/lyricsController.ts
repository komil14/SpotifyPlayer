import { Request, Response } from "express";
import { getLyrics } from "../services/lyricsService";
import Lyric from "../models/Lyric";

// @desc Add a Manual Song
// @route POST /api/lyrics/manual
export const addManualSong = async (req: Request, res: Response) => {
  const { trackName, artistName } = req.body;

  if (!trackName || !artistName) {
    res.status(400).json({ message: "Missing fields" });
    return;
  }

  try {
    // Create a fake ID for manual entries (prefix with 'manual-')
    const manualId = `manual-${Date.now()}`;

    const newSong = await Lyric.create({
      spotifyTrackId: manualId,
      trackName,
      artistName,
      syncedLyrics: null,
      plainLyrics: null,
      isManual: true, // <--- Mark as Manual
    });

    res.status(201).json(newSong);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add song" });
  }
};

// @desc Get All Cached Song Titles
// @route GET /api/lyrics/all
export const getAllCachedSongs = async (req: Request, res: Response) => {
  try {
    // Select only trackName and artistName to keep payload light
    const songs = await Lyric.find({}, "trackName artistName");
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get Lyrics by MongoDB ID
// @route   GET /api/lyrics/:id
export const getLyricById = async (req: Request, res: Response) => {
  try {
    const lyric = await Lyric.findById(req.params.id);
    if (!lyric) {
      res.status(404).json({ message: "Lyric not found" });
      return;
    }
    res.json(lyric);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching lyric" });
  }
};

// @desc    Get Lyrics for a specific track
// @route   GET /api/lyrics
export const getTrackLyrics = async (req: Request, res: Response) => {
  const { trackName, artistName, spotifyTrackId, durationMs } = req.query;

  if (!trackName || !artistName || !spotifyTrackId) {
    res.status(400).json({ message: "Missing track details" });
    return;
  }

  try {
    const lyrics = await getLyrics(
      trackName as string,
      artistName as string,
      spotifyTrackId as string,
      Number(durationMs),
    );

    if (!lyrics || !lyrics.syncedLyrics) {
      res.status(404).json({ message: "Lyrics not found" });
      return;
    }

    res.json(lyrics);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching lyrics" });
  }
};
