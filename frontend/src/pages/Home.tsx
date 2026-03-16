import React, { useCallback, useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Button,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search,
  LibraryMusic,
  PlayArrow,
  Refresh,
  Headphones,
  AccountTree,
  Favorite,
  FavoriteBorder,
  Link as LinkIcon,
  LockOpen,
  CheckCircle,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  getProfile,
  getTopTracks,
  getRecentlyPlayed,
  play,
  logPlay,
  addFavorite,
  removeFavorite,
  checkFavorite,
  getSpotifyLoginUrl,
} from "../services/spotifyService";
import { useNavigate } from "react-router-dom";
import MiniPlayer from "../components/Player/MiniPlayer";
const timeAgo = (dateStr: string): string => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
};

const Dashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [favMap, setFavMap] = useState<Record<string, boolean>>({});
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const profileRes = await getProfile(user._id).catch(() => null);
      const profileData = (profileRes as any)?.data;
      const connected = Boolean(profileData?.display_name);
      setSpotifyConnected(connected);

      if (!connected) {
        setTopTracks([]);
        setRecent([]);
        setFavMap({});
        return;
      }

      const [topRes, recentRes] = await Promise.all([
        getTopTracks(user._id).catch(() => ({ data: [] })),
        getRecentlyPlayed(user._id).catch(() => ({ data: [] })),
      ]);

      setTopTracks((topRes as any).data || []);
      setRecent((recentRes as any).data || []);
      // Check favorite status for all loaded tracks
      const allIds = [
        ...((topRes as any).data || []).map((t: any) => t.id),
        ...((recentRes as any).data || [])
          .map((i: any) => i.track?.id)
          .filter(Boolean),
      ];
      const uniqueIds = Array.from(new Set(allIds));
      const checks: Record<string, boolean> = {};
      await Promise.all(
        uniqueIds.slice(0, 10).map(async (id: string) => {
          try {
            const r = await checkFavorite(user._id, id);
            checks[id] = (r.data as any).isFavorited;
          } catch {
            checks[id] = false;
          }
        }),
      );
      setFavMap(checks);
    } catch (error) {
      console.error("Dashboard load error", error);
      setSpotifyConnected(false);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handlePlayTrack = async (uri: string, trackData?: any) => {
    if (!user) return;
    try {
      await play(user._id, [uri]);
      // Log to analytics if we have track data
      if (trackData) {
        logPlay({
          userId: user._id,
          spotifyTrackId: trackData.id,
          trackName: trackData.name,
          artistName:
            trackData.artists?.[0]?.name || trackData.artists?.[0] || "",
          albumArt: trackData.album?.images?.[0]?.url || "",
          durationMs: trackData.duration_ms || 0,
        }).catch(() => {});
      }
      navigate("/player");
    } catch (err: any) {
      if (err.response?.status === 404)
        alert("Please open Spotify on your device first.");
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    try {
      window.location.href = await getSpotifyLoginUrl();
    } catch (error) {
      console.error("Failed to start Spotify login", error);
      alert("Could not start Spotify connection. Please try again.");
    }
  };

  const handleToggleFav = async (trackData: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const id = trackData.id;
    try {
      if (favMap[id]) {
        await removeFavorite(user._id, id);
        setFavMap((prev) => ({ ...prev, [id]: false }));
      } else {
        await addFavorite({
          userId: user._id,
          spotifyTrackId: id,
          trackName: trackData.name,
          artistName:
            trackData.artists?.[0]?.name || trackData.artists?.[0] || "",
          albumName: trackData.album?.name || "",
          albumArt: trackData.album?.images?.[0]?.url || "",
          trackUri: trackData.uri,
          durationMs: trackData.duration_ms || 0,
        });
        setFavMap((prev) => ({ ...prev, [id]: true }));
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  };

  if (authLoading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress sx={{ color: "#1DB954" }} />
      </Box>
    );
  }

  if (!user) return null;

  // Quick action card data
  const quickActions = [
    {
      icon: <Search sx={{ fontSize: 32 }} />,
      title: "Search Music",
      desc: spotifyConnected
        ? "Find synced lyrics and play through Spotify"
        : "Explore lyrics and discovery tools",
      route: "/search",
      gradient: "linear-gradient(135deg, #1DB954 0%, #1ed760 100%)",
    },
    {
      icon: <LibraryMusic sx={{ fontSize: 32 }} />,
      title: "Your Library",
      desc: spotifyConnected
        ? "Browse your Spotify playlists"
        : "Connect Spotify to unlock playlist import",
      route: "/playlists",
      gradient:
        "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
    },
    {
      icon: <Headphones sx={{ fontSize: 32 }} />,
      title: "Now Playing",
      desc: spotifyConnected
        ? "Full player with live synced lyrics"
        : "Connect Spotify for live playback sync",
      route: "/player",
      gradient:
        "linear-gradient(135deg, rgba(29,185,84,0.25) 0%, rgba(29,185,84,0.05) 100%)",
    },
    {
      icon: <AccountTree sx={{ fontSize: 32 }} />,
      title: "Dictionary",
      desc: "Visualize BST & Red-Black Trees",
      route: "/dictionary",
      gradient:
        "linear-gradient(135deg, rgba(255,82,82,0.2) 0%, rgba(255,82,82,0.05) 100%)",
    },
  ];

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "calc(100vh - 80px)",
        overflow: "hidden",
      }}
    >
      {/* Background Gradient Blobs */}
      <Box
        sx={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "55%",
          height: "55%",
          background:
            "radial-gradient(circle, rgba(29,185,84,0.2) 0%, transparent 65%)",
          filter: "blur(80px)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-15%",
          right: "-8%",
          width: "45%",
          height: "45%",
          background:
            "radial-gradient(circle, rgba(29,185,84,0.1) 0%, transparent 70%)",
          filter: "blur(100px)",
          zIndex: 0,
        }}
      />

      <Container
        maxWidth="lg"
        sx={{ position: "relative", zIndex: 1, pt: 4, pb: 14 }}
      >
        {/* HERO GREETING */}
        <Box sx={{ mb: 5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h3"
              fontWeight={800}
              gutterBottom
              sx={{
                background: "linear-gradient(135deg, #fff 50%, #1DB954 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Good{" "}
              {new Date().getHours() < 12
                ? "Morning"
                : new Date().getHours() < 18
                  ? "Afternoon"
                  : "Evening"}
              , {user.name}
            </Typography>
            <Tooltip title="Refresh">
              <IconButton
                onClick={loadData}
                sx={{
                  color: "#1DB954",
                  bgcolor: "rgba(29,185,84,0.1)",
                  "&:hover": {
                    bgcolor: "rgba(29,185,84,0.2)",
                    transform: "rotate(180deg)",
                  },
                  transition: "all 0.4s ease",
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body1" color="text.secondary">
            {spotifyConnected
              ? "Here’s what’s been playing lately."
              : "Your account is ready. Explore the public lyrics tools now, or connect Spotify for live playback and imports."}
          </Typography>
        </Box>

        {!spotifyConnected && (
          <Box
            sx={{
              mb: 5,
              p: 3,
              borderRadius: 5,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(29,185,84,0.08) 100%)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <LinkIcon sx={{ color: "#1DB954" }} />
                  Spotify Is Optional
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
                  The public dictionary and cached lyrics are available without
                  Spotify. Connect your account only if you want playlists,
                  profile import, playback control, and live synced lyrics.
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ mt: 2 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircle sx={{ color: "#1DB954", fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      Public dictionary and lyrics explorer
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LockOpen sx={{ color: "#1DB954", fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      Spotify unlocks live player features
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/dictionary")}
                  sx={{
                    borderRadius: 50,
                    borderColor: "rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: 600,
                    "&:hover": { borderColor: "#1DB954", color: "#1DB954" },
                  }}
                >
                  Open Dictionary
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConnect}
                  sx={{
                    borderRadius: 50,
                    bgcolor: "#1DB954",
                    color: "#000",
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#1ed760" },
                  }}
                >
                  Connect Spotify
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        {/* QUICK ACTIONS — 4 Cards */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 6, overflowX: "auto", pb: 1 }}
        >
          {quickActions.map((action) => (
            <Box
              key={action.route}
              onClick={() => navigate(action.route)}
              sx={{
                flex: "1 0 200px",
                minWidth: 200,
                p: 3,
                borderRadius: 5,
                cursor: "pointer",
                background: action.gradient,
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(29,185,84,0.3)",
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(255,255,255,0.08)",
                  color: "white",
                }}
              >
                {action.icon}
              </Box>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ color: "white" }}
              >
                {action.title}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.6)" }}
              >
                {action.desc}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* DATA SECTION */}
        {dataLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress sx={{ color: "#1DB954" }} />
          </Box>
        ) : (
          <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
            {/* Top Tracks Column */}
            <Box sx={{ flex: 1, width: "100%" }}>
              <Typography
                variant="h5"
                fontWeight={700}
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PlayArrow sx={{ color: "#1DB954" }} /> Your Top Picks
              </Typography>

              {topTracks.length > 0 ? (
                <Box
                  sx={{
                    borderRadius: 5,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <List disablePadding>
                    {topTracks.slice(0, 5).map((track, i) => (
                      <ListItem key={track.id} disablePadding>
                        <ListItemButton
                          onClick={() => handlePlayTrack(track.uri, track)}
                          sx={{
                            py: 1.5,
                            transition: "all 0.2s ease",
                            "&:hover": {
                              bgcolor: "rgba(29,185,84,0.08)",
                              "& .play-icon": { opacity: 1, color: "#1DB954" },
                              "& .track-number": { opacity: 0 },
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              mr: 2,
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography
                              className="track-number"
                              sx={{
                                color: "gray",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                transition: "opacity 0.2s",
                              }}
                            >
                              {i + 1}
                            </Typography>
                            <PlayArrow
                              className="play-icon"
                              sx={{
                                position: "absolute",
                                opacity: 0,
                                color: "gray",
                                transition: "all 0.2s",
                                fontSize: 20,
                              }}
                            />
                          </Box>
                          <ListItemAvatar>
                            <Avatar
                              src={track.album.images[2]?.url}
                              variant="rounded"
                              sx={{ width: 48, height: 48, borderRadius: 2 }}
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={track.name}
                            secondary={track.artists[0].name}
                            primaryTypographyProps={{
                              fontWeight: 600,
                              noWrap: true,
                            }}
                            secondaryTypographyProps={{ noWrap: true }}
                          />
                          <IconButton
                            onClick={(e) => handleToggleFav(track, e)}
                            sx={{
                              color: favMap[track.id]
                                ? "#1DB954"
                                : "rgba(255,255,255,0.2)",
                              transition: "0.2s",
                              "&:hover": {
                                transform: "scale(1.15)",
                                color: "#1DB954",
                              },
                            }}
                          >
                            {favMap[track.id] ? (
                              <Favorite fontSize="small" />
                            ) : (
                              <FavoriteBorder fontSize="small" />
                            )}
                          </IconButton>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 5,
                    textAlign: "center",
                    borderRadius: 5,
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Headphones sx={{ fontSize: 48, color: "#535353", mb: 2 }} />
                  <Typography color="text.secondary" gutterBottom>
                    {spotifyConnected
                      ? "No listening history found yet."
                      : "Connect Spotify to import your top tracks and start live playback."}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={
                      spotifyConnected
                        ? () => navigate("/dictionary")
                        : handleConnect
                    }
                    sx={{
                      mt: 1,
                      borderRadius: 50,
                      fontWeight: 600,
                      borderColor: "rgba(29,185,84,0.4)",
                      color: "#1DB954",
                      "&:hover": {
                        borderColor: "#1DB954",
                        bgcolor: "rgba(29,185,84,0.08)",
                      },
                    }}
                  >
                    {spotifyConnected
                      ? "Explore Dictionary"
                      : "Connect Spotify"}
                  </Button>
                </Box>
              )}
            </Box>

            {/* Recent History Column */}
            <Box sx={{ flex: 1, width: "100%" }}>
              <Typography
                variant="h5"
                fontWeight={700}
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Refresh sx={{ color: "#1DB954" }} /> Jump Back In
              </Typography>

              {recent.length > 0 ? (
                <Box
                  sx={{
                    borderRadius: 5,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <List disablePadding>
                    {recent.slice(0, 5).map((item, i) => (
                      <ListItem key={i + item.played_at} disablePadding>
                        <ListItemButton
                          onClick={() =>
                            handlePlayTrack(item.track.uri, item.track)
                          }
                          sx={{
                            py: 1.5,
                            transition: "all 0.2s ease",
                            "&:hover": {
                              bgcolor: "rgba(29,185,84,0.08)",
                              "& .play-overlay": { opacity: 1 },
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Box sx={{ position: "relative" }}>
                              <Avatar
                                src={item.track.album.images[2]?.url}
                                variant="rounded"
                                sx={{ width: 48, height: 48, borderRadius: 2 }}
                              />
                              <Box
                                className="play-overlay"
                                sx={{
                                  position: "absolute",
                                  inset: 0,
                                  borderRadius: 2,
                                  bgcolor: "rgba(0,0,0,0.5)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: 0,
                                  transition: "opacity 0.2s",
                                }}
                              >
                                <PlayArrow
                                  sx={{ color: "white", fontSize: 22 }}
                                />
                              </Box>
                            </Box>
                          </ListItemAvatar>
                          <ListItemText
                            primary={item.track.name}
                            secondary={item.track.artists[0].name}
                            primaryTypographyProps={{
                              fontWeight: 600,
                              noWrap: true,
                            }}
                            secondaryTypographyProps={{ noWrap: true }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#535353",
                              whiteSpace: "nowrap",
                              ml: 1,
                            }}
                          >
                            {timeAgo(item.played_at)}
                          </Typography>
                          <IconButton
                            onClick={(e) => handleToggleFav(item.track, e)}
                            sx={{
                              color: favMap[item.track.id]
                                ? "#1DB954"
                                : "rgba(255,255,255,0.2)",
                              ml: 0.5,
                              transition: "0.2s",
                              "&:hover": {
                                transform: "scale(1.15)",
                                color: "#1DB954",
                              },
                            }}
                          >
                            {favMap[item.track.id] ? (
                              <Favorite fontSize="small" />
                            ) : (
                              <FavoriteBorder fontSize="small" />
                            )}
                          </IconButton>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 5,
                    textAlign: "center",
                    borderRadius: 5,
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <LibraryMusic
                    sx={{ fontSize: 48, color: "#535353", mb: 2 }}
                  />
                  <Typography color="text.secondary">
                    {spotifyConnected
                      ? "Start listening on Spotify to see your history here."
                      : "History appears here after you connect Spotify. Until then, the dictionary and lyrics tools are ready to use."}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={
                      spotifyConnected
                        ? () => navigate("/search")
                        : handleConnect
                    }
                    sx={{
                      mt: 2,
                      borderRadius: 50,
                      fontWeight: 600,
                      borderColor: "rgba(29,185,84,0.4)",
                      color: "#1DB954",
                      "&:hover": {
                        borderColor: "#1DB954",
                        bgcolor: "rgba(29,185,84,0.08)",
                      },
                    }}
                  >
                    {spotifyConnected ? "Search Music" : "Connect Spotify"}
                  </Button>
                </Box>
              )}
            </Box>
          </Stack>
        )}

        {spotifyConnected && <MiniPlayer userId={user._id} />}
      </Container>
    </Box>
  );
};

export default Dashboard;
