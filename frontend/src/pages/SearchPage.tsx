import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Paper,
  Box,
  ListItemButton,
} from "@mui/material";
import { PlayArrow, Favorite, FavoriteBorder } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  searchTracks,
  play,
  logPlay,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "../services/spotifyService";
import { useNavigate } from "react-router-dom";
import MiniPlayer from "../components/Player/MiniPlayer";

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [favMap, setFavMap] = useState<Record<string, boolean>>({});
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !query) return;

    try {
      const res = (await searchTracks(user._id, query)) as any;
      const tracks = res.data || [];
      setResults(tracks);
      // Check favorites for all results
      const favChecks: Record<string, boolean> = {};
      await Promise.all(
        tracks.slice(0, 20).map(async (t: any) => {
          try {
            const r = await checkFavorite(user._id, t.id);
            favChecks[t.id] = (r.data as any).isFavorited;
          } catch {
            favChecks[t.id] = false;
          }
        }),
      );
      setFavMap(favChecks);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  // --- PLAY SPECIFIC TRACK LOGIC ---
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
      console.error("Failed to play:", err);
      // Alert the user if no device is found
      if (err.response?.status === 404) {
        alert("Please open Spotify on your device to start playback.");
      }
    }
  };

  const handleToggleFav = async (track: any, e: React.MouseEvent) => {
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

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 12 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Search
      </Typography>

      <form onSubmit={handleSearch}>
        <TextField
          fullWidth
          variant="filled"
          label="What do you want to listen to?"
          placeholder="Songs, Artists, Lyrics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mb: 4, bgcolor: "background.paper", borderRadius: 1 }}
        />
      </form>

      {results.length > 0 && (
        <Paper sx={{ bgcolor: "#181818", borderRadius: 4, overflow: "hidden" }}>
          <List disablePadding>
            {results.map((track) => (
              <ListItem key={track.id} disablePadding>
                {/* Use ListItemButton for clickable rows */}
                <ListItemButton
                  onClick={() => handlePlayTrack(track.uri, track)}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={track.album.images[0]?.url}
                      variant="rounded"
                      sx={{ width: 50, height: 50, mr: 2 }}
                    />
                  </ListItemAvatar>

                  <ListItemText
                    primary={track.name}
                    secondary={track.artists.map((a: any) => a.name).join(", ")}
                    primaryTypographyProps={{
                      color: "white",
                      fontWeight: "bold",
                    }}
                    secondaryTypographyProps={{ color: "gray" }}
                  />

                  <IconButton
                    edge="end"
                    onClick={(e) => handleToggleFav(track, e)}
                    sx={{
                      color: favMap[track.id]
                        ? "#1DB954"
                        : "rgba(255,255,255,0.3)",
                      mr: 0.5,
                      transition: "0.2s",
                      "&:hover": { transform: "scale(1.15)" },
                    }}
                  >
                    {favMap[track.id] ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                  <IconButton edge="end" sx={{ color: "#1DB954" }}>
                    <PlayArrow />
                  </IconButton>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Show message if no results yet */}
      {results.length === 0 && query.length > 0 && (
        <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
          Press Enter to search...
        </Typography>
      )}

      {/* Persistent Mini Player */}
      {user && <MiniPlayer userId={user._id} />}
    </Container>
  );
};

export default SearchPage;
