import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  IconButton,
  Button,
} from "@mui/material";
import {
  ArrowBack,
  PlayArrow,
  Favorite,
  FavoriteBorder,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getPlaylistTracks,
  play,
  logPlay,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "../services/spotifyService";
import MiniPlayer from "../components/Player/MiniPlayer";

interface Track {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const PlaylistDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favMap, setFavMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchTracks = async () => {
      if (!user || !id) return;
      setLoading(true);
      try {
        const res = await getPlaylistTracks(user._id, id);
        const data = res.data as any;

        // Backend may return { name, tracks: [...] } or just an array
        let loadedTracks: Track[] = [];
        if (Array.isArray(data)) {
          loadedTracks = data;
        } else if (data.tracks) {
          // Handle Spotify's { items: [{ track }] } format
          const items = Array.isArray(data.tracks.items)
            ? data.tracks.items
            : data.tracks;
          loadedTracks = items
            .map((item: any) => item.track || item)
            .filter(Boolean);
          if (data.name) setPlaylistName(data.name);
        }
        setTracks(loadedTracks);

        // Check favorites for loaded tracks
        const checks: Record<string, boolean> = {};
        await Promise.all(
          loadedTracks.slice(0, 20).map(async (t) => {
            try {
              const r = await checkFavorite(user._id, t.id);
              checks[t.id] = (r.data as any).isFavorited;
            } catch {
              checks[t.id] = false;
            }
          }),
        );
        setFavMap(checks);
      } catch (err: any) {
        console.error("Failed to load playlist tracks", err);
        setError("Failed to load playlist. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [user, id]);

  const handleToggleFav = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      if (favMap[track.id]) {
        await removeFavorite(user._id, track.id);
        setFavMap((prev) => ({ ...prev, [track.id]: false }));
      } else {
        await addFavorite({
          userId: user._id,
          spotifyTrackId: track.id,
          trackName: track.name,
          artistName: track.artists?.[0]?.name || "",
          albumName: track.album?.name || "",
          albumArt: track.album?.images?.[0]?.url || "",
          trackUri: track.uri,
          durationMs: track.duration_ms || 0,
        });
        setFavMap((prev) => ({ ...prev, [track.id]: true }));
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  };

  const handlePlayTrack = async (uri: string, trackData?: any) => {
    if (!user) return;
    try {
      await play(user._id, [uri]);
      if (trackData) {
        logPlay({
          userId: user._id,
          spotifyTrackId: trackData.id,
          trackName: trackData.name,
          artistName: trackData.artists?.[0]?.name || "",
          albumArt: trackData.album?.images?.[0]?.url || "",
          durationMs: trackData.duration_ms || 0,
        }).catch(() => {});
      }
      navigate("/player");
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert("Please open Spotify on your device first.");
      }
    }
  };

  const handlePlayAll = async () => {
    if (!user || tracks.length === 0) return;
    try {
      const uris = tracks.slice(0, 50).map((t) => t.uri);
      await play(user._id, uris);
      navigate("/player");
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert("Please open Spotify on your device first.");
      }
    }
  };

  if (!user) return null;

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 12 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <IconButton
          onClick={() => navigate("/playlists")}
          sx={{ color: "white" }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {playlistName || "Playlist"}
          </Typography>
          {!loading && (
            <Typography variant="body2" color="text.secondary">
              {tracks.length} track{tracks.length !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
        {tracks.length > 0 && (
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handlePlayAll}
            sx={{ borderRadius: 50 }}
          >
            Play All
          </Button>
        )}
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "#181818",
            borderRadius: 4,
          }}
        >
          <Typography color="error">{error}</Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/playlists")}
            sx={{ mt: 2 }}
          >
            Back to Playlists
          </Button>
        </Paper>
      ) : tracks.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "#181818",
            borderRadius: 4,
          }}
        >
          <Typography color="text.secondary">
            This playlist is empty.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ bgcolor: "#181818", borderRadius: 4, overflow: "hidden" }}>
          <List disablePadding>
            {tracks.map((track, index) => (
              <ListItem key={track.id || index} disablePadding>
                <ListItemButton
                  onClick={() => handlePlayTrack(track.uri, track)}
                  sx={{
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    py: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      width: 32,
                      textAlign: "center",
                      color: "gray",
                      fontWeight: "bold",
                      mr: 1,
                    }}
                  >
                    {index + 1}
                  </Typography>
                  <ListItemAvatar>
                    <Avatar
                      src={
                        track.album?.images?.[2]?.url ||
                        track.album?.images?.[0]?.url
                      }
                      variant="rounded"
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={track.name}
                    secondary={track.artists?.map((a) => a.name).join(", ")}
                    primaryTypographyProps={{ noWrap: true, fontWeight: 500 }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mr: 1 }}
                  >
                    {formatDuration(track.duration_ms)}
                  </Typography>
                  <IconButton
                    onClick={(e) => handleToggleFav(track, e)}
                    sx={{
                      color: favMap[track.id]
                        ? "#1DB954"
                        : "rgba(255,255,255,0.2)",
                      mr: 0.5,
                      transition: "0.2s",
                      "&:hover": { transform: "scale(1.15)", color: "#1DB954" },
                    }}
                  >
                    {favMap[track.id] ? (
                      <Favorite fontSize="small" />
                    ) : (
                      <FavoriteBorder fontSize="small" />
                    )}
                  </IconButton>
                  <PlayArrow sx={{ color: "gray", opacity: 0.5 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <MiniPlayer userId={user._id} />
    </Container>
  );
};

export default PlaylistDetailsPage;
