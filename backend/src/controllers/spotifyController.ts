import { Request, Response } from "express";
import axios from "axios";
import querystring from "querystring";
import User from "../models/User";
import {
  getCurrentlyPlaying,
  refreshAccessToken,
} from "../services/spotifyService";
import { getLyrics } from "../services/lyricsService";
import Lyric from "../models/Lyric";

// ─── Scopes ──────────────────────────────────────────────────────
const SCOPES = [
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-top-read",
  "user-read-recently-played",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

// ─── Helper: Spotify API call with automatic token refresh + 429 retry ──
const spotifyApiCall = async (
  userId: string,
  config: { method: string; url: string; data?: any },
  retries = 2,
) => {
  const user = await User.findById(userId);
  if (!user?.spotifyAccessToken) throw new Error("No Spotify token");

  const makeRequest = (token: string) =>
    axios({
      method: config.method,
      url: config.url,
      data: config.data,
      headers: { Authorization: `Bearer ${token}` },
    });

  let lastError: any;
  let token = user.spotifyAccessToken;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await makeRequest(token);
    } catch (error: any) {
      lastError = error;

      // On 401, refresh token and retry once
      if (error.response?.status === 401 && attempt === 0) {
        const newToken = await refreshAccessToken(user);
        if (newToken) {
          token = newToken;
          continue; // retry with new token
        }
      }

      // On 429 (rate limited), wait and retry with exponential backoff
      if (error.response?.status === 429) {
        const retryAfter = parseInt(
          error.response.headers["retry-after"] || "1",
          10,
        );
        const waitMs = retryAfter * 1000 * Math.pow(2, attempt);
        console.log(
          `Spotify 429 rate limited. Waiting ${waitMs}ms before retry ${attempt + 1}...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};

// @desc    Redirect user to Spotify Auth Page
// @route   GET /api/spotify/login
export const loginSpotify = (req: Request, res: Response) => {
  const params = querystring.stringify({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    // We pass the local user ID in 'state' so we know who to link this Spotify account to
    state: req.query.userId as string,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
};

// @desc    Seek to position
// @route   PUT /api/spotify/seek
export const seekTrack = async (req: Request, res: Response) => {
  const { positionMs, userId } = req.query;

  // Spotify API expects 'position_ms' in query params
  // URL: https://api.spotify.com/v1/me/player/seek?position_ms=25000
  const endpoint = `seek?position_ms=${positionMs}`;

  const success = await sendCommand(endpoint, userId as string, "put");
  res.status(success ? 204 : 500).send();
};

// @desc    Handle Spotify Callback & Exchange Code for Token
// @route   GET /api/spotify/callback
export const spotifyCallback = async (req: Request, res: Response) => {
  const code = (req.query.code as string) || null;
  const userId = (req.query.state as string) || null; // This is the user ID we sent earlier

  if (!code || !userId) {
    res.redirect(`${process.env.FRONTEND_URL}/home?error=missing_data`);
    return;
  }

  try {
    // 1. Exchange Authorization Code for Access/Refresh Tokens
    const authOptions = {
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: querystring.stringify({
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET,
          ).toString("base64"),
      },
    };

    const tokenResponse = await axios(authOptions);
    const { access_token, refresh_token } = tokenResponse.data;

    // 2. Save Tokens to Database for this User
    await User.findByIdAndUpdate(userId, {
      spotifyAccessToken: access_token,
      spotifyRefreshToken: refresh_token,
    });

    // 3. Redirect back to Frontend
    res.redirect(`${process.env.FRONTEND_URL}/home?spotify_connected=true`);
  } catch (error) {
    console.error("Spotify Auth Error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/home?error=auth_failed`);
  }
};

// ─── Helper: Send player command with token refresh ─────────────
const sendCommand = async (
  endpoint: string,
  userId: string,
  method: "post" | "put" = "post",
) => {
  try {
    await spotifyApiCall(userId, {
      method,
      url: `https://api.spotify.com/v1/me/player/${endpoint}`,
    });
    return true;
  } catch (error: any) {
    console.error(
      `Error sending command ${endpoint}:`,
      error.response?.data || error.message,
    );
    return false;
  }
};

// @desc    Play/Resume with Auto-Device Detection
// @route   POST /api/spotify/play
export const playTrack = async (req: Request, res: Response) => {
  const { userId } = req.query;
  const { uris } = req.body;

  try {
    const body = uris ? { uris } : undefined;

    // Attempt 1: Just Play (Works if device is active)
    try {
      await spotifyApiCall(userId as string, {
        method: "put",
        url: "https://api.spotify.com/v1/me/player/play",
        data: body,
      });
      res.status(204).send();
    } catch (err: any) {
      // IF 404: No Active Device -> Try to find an idle one
      if (err.response?.status === 404) {
        console.log("No active device. Searching for available devices...");

        const deviceRes = await spotifyApiCall(userId as string, {
          method: "get",
          url: "https://api.spotify.com/v1/me/player/devices",
        });
        const devices = deviceRes.data.devices;

        if (devices.length > 0) {
          const firstDeviceId = devices[0].id;
          console.log(`Activating device: ${devices[0].name}`);

          await spotifyApiCall(userId as string, {
            method: "put",
            url: `https://api.spotify.com/v1/me/player/play?device_id=${firstDeviceId}`,
            data: body,
          });
          res.status(204).send();
        } else {
          res.status(404).json({
            message:
              "No Spotify devices found. Open Spotify on your phone/laptop.",
          });
        }
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error("Play Error:", error.response?.status || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.error?.message || "Failed to play track",
    });
  }
};

// @desc    Pause
// @route   POST /api/spotify/pause
export const pauseTrack = async (req: Request, res: Response) => {
  const success = await sendCommand("pause", req.query.userId as string, "put");
  res.status(success ? 204 : 500).send();
};

// @desc    Next Track
// @route   POST /api/spotify/next
export const nextTrack = async (req: Request, res: Response) => {
  const success = await sendCommand("next", req.query.userId as string, "post");
  res.status(success ? 204 : 500).send();
};

// @desc    Previous Track
// @route   POST /api/spotify/previous
export const previousTrack = async (req: Request, res: Response) => {
  const success = await sendCommand(
    "previous",
    req.query.userId as string,
    "post",
  );
  res.status(success ? 204 : 500).send();
};

export const getCurrentTrack = async (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) {
    res.status(400).json({ message: "User ID required" });
    return;
  }

  try {
    const trackData = await getCurrentlyPlaying(userId as string);

    // 1. Handle Empty/Ad
    if (
      !trackData ||
      !trackData.item ||
      trackData.currently_playing_type === "ad"
    ) {
      res.status(200).json({ isPlaying: false });
      return;
    }

    const safeId = trackData.item.id;

    // 2. FAST DB CHECK: Do we have lyrics already?
    // We check the database directly. This is usually < 20ms.
    const cachedLyric = await Lyric.findOne({ spotifyTrackId: safeId });

    // 3. Prepare Response
    let albumArt = "https://via.placeholder.com/300";
    if (trackData.item.album?.images?.length)
      albumArt = trackData.item.album.images[0].url;
    else if (trackData.item.images?.length)
      albumArt = trackData.item.images[0].url;

    const responsePayload: any = {
      isPlaying: trackData.is_playing,
      progressMs: trackData.progress_ms,
      item: {
        id: safeId,
        name: trackData.item.name,
        artists: trackData.item.artists
          ? trackData.item.artists.map((a: any) => a.name)
          : ["Unknown"],
        albumArt: albumArt,
        durationMs: trackData.item.duration_ms,
      },
      // If cached, send it! If not, send null (Frontend will fetch later)
      lyrics: cachedLyric ? cachedLyric.syncedLyrics : null,
    };

    res.json(responsePayload);

    // Note: If lyrics weren't found, we DON'T fetch them here.
    // Then let the Frontend see the "null" lyrics and trigger a separate fetch.
    // This ensures the Image/Title load instantly.
  } catch (error) {
    console.error(error);
    res.status(200).json({ isPlaying: false });
  }
};

// @desc    Get User Profile
// @route   GET /api/spotify/profile
export const getUserProfile = async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const response = await spotifyApiCall(userId as string, {
      method: "get",
      url: "https://api.spotify.com/v1/me",
    });
    res.json(response.data);
  } catch (error) {
    console.error("Profile Error", error);
    res.status(500).json(null);
  }
};

// @desc    Get Top Tracks
// @route   GET /api/spotify/top-tracks
export const getTopTracks = async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const response = await spotifyApiCall(userId as string, {
      method: "get",
      url: "https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term",
    });
    res.json(response.data.items);
  } catch (error) {
    console.error("Top Tracks Error", error);
    res.status(500).json([]);
  }
};

// @desc    Get Recently Played
// @route   GET /api/spotify/recently-played
export const getRecentlyPlayed = async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const response = await spotifyApiCall(userId as string, {
      method: "get",
      url: "https://api.spotify.com/v1/me/player/recently-played?limit=10",
    });
    res.json(response.data.items);
  } catch (error) {
    console.error("Recent Tracks Error", error);
    res.status(500).json([]);
  }
};

// @desc    Get User Playlists
// @route   GET /api/spotify/playlists
export const getUserPlaylists = async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const response = await spotifyApiCall(userId as string, {
      method: "get",
      url: "https://api.spotify.com/v1/me/playlists",
    });
    res.json(response.data.items);
  } catch (error) {
    res.status(500).json([]);
  }
};

// @desc    Search Spotify
// @route   GET /api/spotify/search
export const searchSpotify = async (req: Request, res: Response) => {
  const { userId, q } = req.query;
  try {
    const response = await spotifyApiCall(userId as string, {
      method: "get",
      url: `https://api.spotify.com/v1/search?q=${encodeURIComponent(q as string)}&type=track,artist,album&limit=10`,
    });
    res.json(response.data.tracks.items);
  } catch (error) {
    res.status(500).json([]);
  }
};

// @desc    Get Tracks of a specific Playlist
// @route   GET /api/spotify/playlists/:id
export const getPlaylistTracks = async (req: Request, res: Response) => {
  const { userId } = req.query;
  const { id } = req.params;

  if (!id || id === "undefined") {
    res.status(400).json([]);
    return;
  }

  try {
    const response = await spotifyApiCall(userId as string, {
      method: "get",
      url: `https://api.spotify.com/v1/playlists/${id}/tracks`,
    });
    res.json(response.data.items);
  } catch (error: any) {
    console.error(
      "Playlist Fetch Error:",
      error.response?.data || error.message,
    );
    res.status(500).json([]);
  }
};

// @desc    Get available Spotify devices
// @route   GET /api/spotify/devices
export const getDevices = async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const response = await spotifyApiCall(userId as string, {
      method: "get",
      url: "https://api.spotify.com/v1/me/player/devices",
    });
    res.json(response.data.devices);
  } catch (error) {
    console.error("Devices Error", error);
    res.status(500).json([]);
  }
};

// @desc    Get the user's playback queue
// @route   GET /api/spotify/queue
export const getQueue = async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const response = await spotifyApiCall(userId as string, {
      method: "get",
      url: "https://api.spotify.com/v1/me/player/queue",
    });
    res.json(response.data);
  } catch (error: any) {
    console.error("Queue Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to get queue" });
  }
};

// @desc    Add a track to the playback queue
// @route   POST /api/spotify/queue
export const addToQueue = async (req: Request, res: Response) => {
  const { userId, uri } = req.query;

  if (!uri) {
    res.status(400).json({ message: "uri query param is required" });
    return;
  }

  try {
    await spotifyApiCall(userId as string, {
      method: "post",
      url: `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri as string)}`,
    });
    res.status(204).send();
  } catch (error: any) {
    console.error("Add to Queue Error:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .json({ message: "Failed to add to queue" });
  }
};

// @desc    Set playback volume
// @route   PUT /api/spotify/volume
export const setVolume = async (req: Request, res: Response) => {
  const { userId, volume_percent } = req.query;

  if (volume_percent === undefined) {
    res
      .status(400)
      .json({ message: "volume_percent query param is required (0-100)" });
    return;
  }

  try {
    await spotifyApiCall(userId as string, {
      method: "put",
      url: `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume_percent}`,
    });
    res.status(204).send();
  } catch (error: any) {
    console.error("Volume Error:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .json({ message: "Failed to set volume" });
  }
};

// @desc    Toggle shuffle mode
// @route   PUT /api/spotify/shuffle
export const setShuffle = async (req: Request, res: Response) => {
  const { userId, state } = req.query; // state = true or false

  if (state === undefined) {
    res
      .status(400)
      .json({ message: "state query param is required (true/false)" });
    return;
  }

  try {
    await spotifyApiCall(userId as string, {
      method: "put",
      url: `https://api.spotify.com/v1/me/player/shuffle?state=${state}`,
    });
    res.status(204).send();
  } catch (error: any) {
    console.error("Shuffle Error:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .json({ message: "Failed to set shuffle" });
  }
};

// @desc    Set repeat mode
// @route   PUT /api/spotify/repeat
export const setRepeat = async (req: Request, res: Response) => {
  const { userId, state } = req.query; // state = off, context, or track

  if (!state) {
    res
      .status(400)
      .json({ message: "state query param is required (off/context/track)" });
    return;
  }

  const valid = ["off", "context", "track"];
  if (!valid.includes(state as string)) {
    res
      .status(400)
      .json({ message: `state must be one of: ${valid.join(", ")}` });
    return;
  }

  try {
    await spotifyApiCall(userId as string, {
      method: "put",
      url: `https://api.spotify.com/v1/me/player/repeat?state=${state}`,
    });
    res.status(204).send();
  } catch (error: any) {
    console.error("Repeat Error:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .json({ message: "Failed to set repeat" });
  }
};

// @desc    Transfer playback to a different device
// @route   PUT /api/spotify/transfer
export const transferPlayback = async (req: Request, res: Response) => {
  const { userId } = req.query;
  const { deviceId, play } = req.body;

  if (!deviceId) {
    res.status(400).json({ message: "deviceId is required in body" });
    return;
  }

  try {
    await spotifyApiCall(userId as string, {
      method: "put",
      url: "https://api.spotify.com/v1/me/player",
      data: {
        device_ids: [deviceId],
        play: play !== undefined ? play : true,
      },
    });
    res.status(204).send();
  } catch (error: any) {
    console.error("Transfer Error:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .json({ message: "Failed to transfer playback" });
  }
};
