import axios from "axios";
import authService from "./authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8888/api"
    : "/api");

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export const getSpotifyLoginUrl = async (): Promise<string> => {
  const response = await api.get<{ authUrl: string }>("/spotify/login-url");
  return response.data.authUrl;
};

// --- CORE PLAYER FUNCTIONS ---
export const getCurrentTrack = (_userId?: string) =>
  api.get("/spotify/current-track");

export const getLyrics = (
  trackName: string,
  artistName: string,
  spotifyTrackId: string,
  durationMs: number,
) =>
  api.get("/lyrics", {
    params: { trackName, artistName, spotifyTrackId, durationMs },
  });

export const play = (_userId?: string, uris?: string[]) =>
  api.post("/spotify/play", { uris });

export const pause = (_userId?: string) =>
  api.post("/spotify/pause");

export const next = (_userId?: string) =>
  api.post("/spotify/next");

export const previous = (_userId?: string) =>
  api.post("/spotify/previous");

export const seek = (_userId: string, positionMs: number) =>
  api.put("/spotify/seek", {}, { params: { positionMs } });

// --- DATA FUNCTIONS ---

export const getProfile = (_userId?: string) =>
  api.get("/spotify/profile");

export const getTopTracks = (_userId?: string) =>
  api.get("/spotify/top-tracks");

export const getRecentlyPlayed = (_userId?: string) =>
  api.get("/spotify/recently-played");

export const getPlaylists = (_userId?: string) =>
  api.get("/spotify/playlists");

export const getPlaylistTracks = (_userId: string, playlistId: string) =>
  api.get(`/spotify/playlists/${playlistId}`);

export const searchTracks = (_userId: string, query: string) =>
  api.get("/spotify/search", { params: { q: query } });

export const getAllCachedSongs = () =>
  api.get("/lyrics/all");

export const addManualSong = (trackName: string, artistName: string) =>
  api.post("/lyrics/manual", {
    trackName,
    artistName,
  });

// --- PLAYBACK CONTROLS ---

export const getQueue = (_userId?: string) =>
  api.get("/spotify/queue");

export const addToQueue = (_userId: string, uri: string) =>
  api.post("/spotify/queue", {}, { params: { uri } });

export const setVolume = (_userId: string, volumePercent: number) =>
  api.put(
    "/spotify/volume",
    {},
    { params: { volume_percent: volumePercent } },
  );

export const setShuffle = (_userId: string, state: boolean) =>
  api.put("/spotify/shuffle", {}, { params: { state } });

export const setRepeat = (
  _userId: string,
  state: "off" | "context" | "track",
) => api.put("/spotify/repeat", {}, { params: { state } });

export const transferPlayback = (
  _userId: string,
  deviceId: string,
  autoPlay?: boolean,
) =>
  api.put(
    "/spotify/transfer",
    { deviceId, play: autoPlay ?? true },
  );

export const getDevices = (_userId?: string) =>
  api.get("/spotify/devices");

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
}) => {
  const { userId: _userId, ...payload } = data;
  return api.post("/favorites", payload);
};

export const removeFavorite = (_userId: string, trackId: string) =>
  api.delete(`/favorites/${trackId}`);

export const getFavorites = (_userId?: string) =>
  api.get("/favorites");

export const checkFavorite = (_userId: string, trackId: string) =>
  api.get(`/favorites/check/${trackId}`);

// --- ANALYTICS ---

export const logPlay = (data: {
  userId: string;
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumArt?: string;
  durationMs?: number;
}) => {
  const { userId: _userId, ...payload } = data;
  return api.post("/analytics/log", payload);
};

export const getStats = (_userId?: string) =>
  api.get("/analytics/stats");

export const getHistory = (_userId: string, page?: number, limit?: number) =>
  api.get("/analytics/history", { params: { page, limit } });
