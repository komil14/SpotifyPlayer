import axios from "axios";

// Ensure this matches your Backend Port (8888)
const API_URL = "http://127.0.0.1:8888/api/spotify";
const FAVORITES_URL = "http://127.0.0.1:8888/api/favorites";
const ANALYTICS_URL = "http://127.0.0.1:8888/api/analytics";

// --- CORE PLAYER FUNCTIONS ---
export const getCurrentTrack = (userId: string) =>
  axios.get(`${API_URL}/current-track`, { params: { userId } });

export const getLyrics = (
  trackName: string,
  artistName: string,
  spotifyTrackId: string,
  durationMs: number,
) =>
  axios.get("http://127.0.0.1:8888/api/lyrics", {
    params: { trackName, artistName, spotifyTrackId, durationMs },
  });

export const play = (userId: string, uris?: string[]) =>
  axios.post(`${API_URL}/play`, { uris }, { params: { userId } });

export const pause = (userId: string) =>
  axios.post(`${API_URL}/pause`, {}, { params: { userId } });

export const next = (userId: string) =>
  axios.post(`${API_URL}/next`, {}, { params: { userId } });

export const previous = (userId: string) =>
  axios.post(`${API_URL}/previous`, {}, { params: { userId } });

export const seek = (userId: string, positionMs: number) =>
  axios.put(`${API_URL}/seek`, {}, { params: { userId, positionMs } });

// --- DATA FUNCTIONS ---

export const getProfile = (userId: string) =>
  axios.get(`${API_URL}/profile`, { params: { userId } });

export const getTopTracks = (userId: string) =>
  axios.get(`${API_URL}/top-tracks`, { params: { userId } });

export const getRecentlyPlayed = (userId: string) =>
  axios.get(`${API_URL}/recently-played`, { params: { userId } });

export const getPlaylists = (userId: string) =>
  axios.get(`${API_URL}/playlists`, { params: { userId } });

// This is the one that was missing/causing the error:
export const getPlaylistTracks = (userId: string, playlistId: string) =>
  axios.get(`${API_URL}/playlists/${playlistId}`, { params: { userId } });

export const searchTracks = (userId: string, query: string) =>
  axios.get(`${API_URL}/search`, { params: { userId, q: query } });

export const getAllCachedSongs = () =>
  axios.get("http://127.0.0.1:8888/api/lyrics/all");

export const addManualSong = (trackName: string, artistName: string) =>
  axios.post("http://127.0.0.1:8888/api/lyrics/manual", {
    trackName,
    artistName,
  });

// --- PLAYBACK CONTROLS ---

export const getQueue = (userId: string) =>
  axios.get(`${API_URL}/queue`, { params: { userId } });

export const addToQueue = (userId: string, uri: string) =>
  axios.post(`${API_URL}/queue`, {}, { params: { userId, uri } });

export const setVolume = (userId: string, volumePercent: number) =>
  axios.put(
    `${API_URL}/volume`,
    {},
    { params: { userId, volume_percent: volumePercent } },
  );

export const setShuffle = (userId: string, state: boolean) =>
  axios.put(`${API_URL}/shuffle`, {}, { params: { userId, state } });

export const setRepeat = (userId: string, state: "off" | "context" | "track") =>
  axios.put(`${API_URL}/repeat`, {}, { params: { userId, state } });

export const transferPlayback = (
  userId: string,
  deviceId: string,
  autoPlay?: boolean,
) =>
  axios.put(
    `${API_URL}/transfer`,
    { deviceId, play: autoPlay ?? true },
    { params: { userId } },
  );

export const getDevices = (userId: string) =>
  axios.get(`${API_URL}/devices`, { params: { userId } });

// --- FAVORITES ---

export const addFavorite = (data: {
  userId: string;
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  albumArt?: string;
  trackUri?: string;
  durationMs?: number;
}) => axios.post(FAVORITES_URL, data);

export const removeFavorite = (userId: string, trackId: string) =>
  axios.delete(`${FAVORITES_URL}/${trackId}`, { params: { userId } });

export const getFavorites = (userId: string) =>
  axios.get(FAVORITES_URL, { params: { userId } });

export const checkFavorite = (userId: string, trackId: string) =>
  axios.get(`${FAVORITES_URL}/check/${trackId}`, { params: { userId } });

// --- ANALYTICS ---

export const logPlay = (data: {
  userId: string;
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumArt?: string;
  durationMs?: number;
}) => axios.post(`${ANALYTICS_URL}/log`, data);

export const getStats = (userId: string) =>
  axios.get(`${ANALYTICS_URL}/stats`, { params: { userId } });

export const getHistory = (userId: string, page?: number, limit?: number) =>
  axios.get(`${ANALYTICS_URL}/history`, { params: { userId, page, limit } });
