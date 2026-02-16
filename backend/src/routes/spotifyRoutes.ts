import express from "express";
import {
  loginSpotify,
  spotifyCallback,
  getCurrentTrack,
  playTrack,
  pauseTrack,
  nextTrack,
  previousTrack,
  seekTrack,
  getTopTracks,
  getUserPlaylists,
  getRecentlyPlayed,
  searchSpotify,
  getUserProfile,
  getPlaylistTracks,
  getDevices,
  getQueue,
  addToQueue,
  setVolume,
  setShuffle,
  setRepeat,
  transferPlayback,
} from "../controllers/spotifyController";

const router = express.Router();

// Auth & Core Player Routes
router.get("/login", loginSpotify);
router.get("/callback", spotifyCallback);
router.get("/current-track", getCurrentTrack);
router.post("/play", playTrack);
router.post("/pause", pauseTrack);
router.post("/next", nextTrack);
router.post("/previous", previousTrack);
router.put("/seek", seekTrack);

// Dashboard & Data Routes
router.get("/profile", getUserProfile);
router.get("/top-tracks", getTopTracks);
router.get("/recently-played", getRecentlyPlayed);
router.get("/search", searchSpotify);
router.get("/devices", getDevices);

// Playlist Routes
router.get("/playlists", getUserPlaylists); // Get List of Playlists
router.get("/playlists/:id", getPlaylistTracks); // Get Tracks of ONE Playlist

// Queue Management
router.get("/queue", getQueue); // Get playback queue
router.post("/queue", addToQueue); // Add track to queue

// Player Settings
router.put("/volume", setVolume); // Set volume (0-100)
router.put("/shuffle", setShuffle); // Toggle shuffle
router.put("/repeat", setRepeat); // Set repeat mode
router.put("/transfer", transferPlayback); // Transfer playback to device

export default router;
