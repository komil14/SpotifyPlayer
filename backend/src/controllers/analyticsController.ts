import { Request, Response } from "express";
import ListeningHistory from "../models/ListeningHistory";
import mongoose from "mongoose";

// @desc    Log a play event (called when a track starts playing)
// @route   POST /api/analytics/log
export const logPlay = async (req: Request, res: Response) => {
  const {
    userId,
    spotifyTrackId,
    trackName,
    artistName,
    albumArt,
    durationMs,
  } = req.body;

  if (!userId || !spotifyTrackId || !trackName || !artistName) {
    res
      .status(400)
      .json({
        message:
          "userId, spotifyTrackId, trackName, and artistName are required",
      });
    return;
  }

  try {
    const entry = await ListeningHistory.create({
      userId,
      spotifyTrackId,
      trackName,
      artistName,
      albumArt: albumArt || "",
      durationMs: durationMs || 0,
      playedAt: new Date(),
    });
    res.status(201).json(entry);
  } catch (error: any) {
    console.error("Log Play Error:", error.message);
    res.status(500).json({ message: "Failed to log play" });
  }
};

// @desc    Get listening statistics for a user
// @route   GET /api/analytics/stats
export const getStats = async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    const uid = new mongoose.Types.ObjectId(userId as string);

    // Run all aggregations in parallel
    const [
      totalPlays,
      totalListeningTime,
      topArtists,
      topTracks,
      recentActivity,
    ] = await Promise.all([
      // Total play count
      ListeningHistory.countDocuments({ userId: uid }),

      // Total listening time (ms)
      ListeningHistory.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: null, total: { $sum: "$durationMs" } } },
      ]),

      // Top 5 artists by play count
      ListeningHistory.aggregate([
        { $match: { userId: uid } },
        {
          $group: {
            _id: "$artistName",
            playCount: { $sum: 1 },
            lastPlayed: { $max: "$playedAt" },
          },
        },
        { $sort: { playCount: -1 } },
        { $limit: 5 },
        {
          $project: {
            artistName: "$_id",
            playCount: 1,
            lastPlayed: 1,
            _id: 0,
          },
        },
      ]),

      // Top 5 tracks by play count
      ListeningHistory.aggregate([
        { $match: { userId: uid } },
        {
          $group: {
            _id: { trackId: "$spotifyTrackId", trackName: "$trackName" },
            artistName: { $first: "$artistName" },
            albumArt: { $first: "$albumArt" },
            playCount: { $sum: 1 },
            lastPlayed: { $max: "$playedAt" },
          },
        },
        { $sort: { playCount: -1 } },
        { $limit: 5 },
        {
          $project: {
            spotifyTrackId: "$_id.trackId",
            trackName: "$_id.trackName",
            artistName: 1,
            albumArt: 1,
            playCount: 1,
            lastPlayed: 1,
            _id: 0,
          },
        },
      ]),

      // Last 7 days activity (plays per day)
      ListeningHistory.aggregate([
        {
          $match: {
            userId: uid,
            playedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$playedAt" },
            },
            count: { $sum: 1 },
            minutesListened: { $sum: { $divide: ["$durationMs", 60000] } },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            count: 1,
            minutesListened: { $round: ["$minutesListened", 0] },
            _id: 0,
          },
        },
      ]),
    ]);

    const totalMs = totalListeningTime[0]?.total || 0;
    const totalMinutes = Math.round(totalMs / 60000);
    const totalHours = Math.round(totalMinutes / 60);

    res.json({
      totalPlays,
      totalMinutes,
      totalHours,
      topArtists,
      topTracks,
      recentActivity,
    });
  } catch (error: any) {
    console.error("Stats Error:", error.message);
    res.status(500).json({ message: "Failed to get stats" });
  }
};

// @desc    Get listening history for a user (paginated)
// @route   GET /api/analytics/history
export const getHistory = async (req: Request, res: Response) => {
  const { userId, page = "1", limit = "20" } = req.query;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [history, total] = await Promise.all([
      ListeningHistory.find({ userId })
        .sort({ playedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ListeningHistory.countDocuments({ userId }),
    ]);

    res.json({
      history,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("History Error:", error.message);
    res.status(500).json({ message: "Failed to get history" });
  }
};
