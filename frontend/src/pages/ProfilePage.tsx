import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Avatar,
  CircularProgress,
  Button,
  Stack,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Person,
  MusicNote,
  Logout,
  Link as LinkIcon,
  ArrowBack,
  Headphones,
  Public,
  PeopleAlt,
  Star,
  Refresh,
  PlayCircle,
  AccessTime,
  TrendingUp,
  Album,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { getProfile, getStats } from "../services/spotifyService";
import { useNavigate } from "react-router-dom";
import { keyframes } from "@emotion/react";

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.5); }
  70% { box-shadow: 0 0 0 15px rgba(29, 185, 84, 0); }
  100% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
`;

interface SpotifyProfile {
  display_name: string;
  email?: string;
  images?: { url: string }[];
  product?: string;
  country?: string;
  followers?: { total: number };
  external_urls?: { spotify: string };
}

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const profileRes = await getProfile(user._id).catch(() => null);
        const statsRes = await getStats(user._id).catch(() => null);
        if (profileRes) {
          const data = (profileRes as any).data;
          if (data && data.display_name) {
            setProfile(data);
            setSpotifyConnected(true);
          }
        }
        if (statsRes) {
          setStats((statsRes as any).data);
        }
      } catch (err: any) {
        console.error("Failed to load profile", err);
        setSpotifyConnected(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleConnect = () => {
    if (user) {
      window.location.href = `http://127.0.0.1:8888/api/spotify/login?userId=${user._id}`;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  const avatarUrl = profile?.images?.[0]?.url;

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
          top: "-25%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70%",
          height: "60%",
          background:
            "radial-gradient(circle, rgba(29,185,84,0.3) 0%, transparent 65%)",
          filter: "blur(80px)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "40%",
          height: "45%",
          background:
            "radial-gradient(circle, rgba(29,185,84,0.12) 0%, transparent 70%)",
          filter: "blur(100px)",
          zIndex: 0,
        }}
      />

      {/* Back Button */}
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1, pt: 3 }}>
        <IconButton
          onClick={() => navigate("/dashboard")}
          sx={{ color: "white", mb: 2 }}
        >
          <ArrowBack />
        </IconButton>
      </Container>

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1, pb: 12 }}>
        {/* Glassmorphism Card */}
        <Box
          sx={{
            p: { xs: 4, sm: 5 },
            borderRadius: 6,
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.04)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {loading ? (
            <Box sx={{ py: 10 }}>
              <CircularProgress sx={{ color: "#1DB954" }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading profile...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Avatar with glow ring */}
              <Box
                sx={{
                  display: "inline-block",
                  borderRadius: "50%",
                  p: "4px",
                  background:
                    "linear-gradient(135deg, #1DB954 0%, #1ed760 50%, #1DB954 100%)",
                  animation: `${float} 4s ease-in-out infinite`,
                  mb: 3,
                }}
              >
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 130,
                    height: 130,
                    bgcolor: "#181818",
                    border: "4px solid #121212",
                  }}
                >
                  {!avatarUrl && (
                    <Person sx={{ fontSize: 65, color: "#535353" }} />
                  )}
                </Avatar>
              </Box>

              {/* Name */}
              <Typography
                variant="h4"
                fontWeight={800}
                gutterBottom
                sx={{
                  background: "linear-gradient(135deg, #fff 40%, #1DB954 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {profile?.display_name || user.name}
              </Typography>

              <Typography variant="body1" color="text.secondary">
                {user.email}
              </Typography>

              {/* Stats Row */}
              {spotifyConnected && (
                <Stack
                  direction="row"
                  spacing={0}
                  justifyContent="center"
                  sx={{
                    mt: 4,
                    mb: 1,
                    mx: "auto",
                    maxWidth: 380,
                    bgcolor: "rgba(255,255,255,0.03)",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.06)",
                    overflow: "hidden",
                  }}
                >
                  {profile?.product && (
                    <Box
                      sx={{
                        flex: 1,
                        py: 2.5,
                        px: 1,
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Star
                        sx={{
                          color:
                            profile.product === "premium"
                              ? "#1DB954"
                              : "#535353",
                          fontSize: 22,
                          mb: 0.5,
                        }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: "white" }}
                      >
                        {profile.product === "premium" ? "Premium" : "Free"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Plan
                      </Typography>
                    </Box>
                  )}
                  {profile?.followers !== undefined && (
                    <Box
                      sx={{
                        flex: 1,
                        py: 2.5,
                        px: 1,
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <PeopleAlt
                        sx={{ color: "#1DB954", fontSize: 22, mb: 0.5 }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: "white" }}
                      >
                        {profile.followers.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Followers
                      </Typography>
                    </Box>
                  )}
                  {profile?.country && (
                    <Box sx={{ flex: 1, py: 2.5, px: 1 }}>
                      <Public
                        sx={{ color: "#1DB954", fontSize: 22, mb: 0.5 }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: "white" }}
                      >
                        {profile.country}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Region
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}

              {/* Connection Status Badge */}
              <Box sx={{ mt: 3, mb: 4 }}>
                {spotifyConnected ? (
                  <Chip
                    icon={<Headphones sx={{ fontSize: 18 }} />}
                    label="Spotify Connected"
                    sx={{
                      bgcolor: "rgba(29,185,84,0.15)",
                      color: "#1DB954",
                      border: "1px solid rgba(29,185,84,0.3)",
                      fontWeight: 600,
                      px: 1,
                    }}
                  />
                ) : (
                  <Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      Connect your Spotify to unlock all features
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<LinkIcon />}
                      onClick={handleConnect}
                      sx={{
                        borderRadius: 50,
                        fontWeight: 700,
                        bgcolor: "#1DB954",
                        color: "#000",
                        animation: `${pulse} 2.5s infinite`,
                        "&:hover": { bgcolor: "#1ed760" },
                      }}
                    >
                      Connect Spotify
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Listening Stats Section */}
              {stats && stats.totalPlays > 0 && (
                <>
                  <Box
                    sx={{
                      height: "1px",
                      mx: -2,
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                      mb: 3,
                    }}
                  />
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      background:
                        "linear-gradient(135deg, #fff 40%, #1DB954 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    <TrendingUp
                      sx={{ color: "#1DB954", WebkitTextFillColor: "initial" }}
                    />{" "}
                    Listening Stats
                  </Typography>

                  {/* Stats Cards */}
                  <Stack
                    direction="row"
                    spacing={0}
                    justifyContent="center"
                    sx={{
                      mb: 3,
                      mx: "auto",
                      maxWidth: 380,
                      bgcolor: "rgba(255,255,255,0.03)",
                      borderRadius: 4,
                      border: "1px solid rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        py: 2.5,
                        px: 1,
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                        textAlign: "center",
                      }}
                    >
                      <PlayCircle
                        sx={{ color: "#1DB954", fontSize: 22, mb: 0.5 }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: "white" }}
                      >
                        {stats.totalPlays}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Plays
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        py: 2.5,
                        px: 1,
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                        textAlign: "center",
                      }}
                    >
                      <AccessTime
                        sx={{ color: "#1DB954", fontSize: 22, mb: 0.5 }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: "white" }}
                      >
                        {stats.totalHours > 0
                          ? `${stats.totalHours}h`
                          : `${stats.totalMinutes}m`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Listened
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, py: 2.5, px: 1, textAlign: "center" }}>
                      <Album sx={{ color: "#1DB954", fontSize: 22, mb: 0.5 }} />
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: "white" }}
                      >
                        {stats.topArtists?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Artists
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Top Artists */}
                  {stats.topArtists?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}
                      >
                        Top Artists
                      </Typography>
                      <Stack spacing={0.5}>
                        {stats.topArtists.map((a: any, i: number) => (
                          <Box
                            key={i}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              px: 2,
                              py: 0.8,
                              borderRadius: 2,
                              bgcolor: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#1DB954",
                                  fontWeight: 700,
                                  width: 16,
                                }}
                              >
                                {i + 1}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "white", fontWeight: 500 }}
                              >
                                {a.artistName}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {a.playCount} plays
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Top Tracks */}
                  {stats.topTracks?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}
                      >
                        Top Tracks
                      </Typography>
                      <Stack spacing={0.5}>
                        {stats.topTracks.map((t: any, i: number) => (
                          <Box
                            key={i}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              px: 2,
                              py: 0.8,
                              borderRadius: 2,
                              bgcolor: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#1DB954",
                                  fontWeight: 700,
                                  width: 16,
                                }}
                              >
                                {i + 1}
                              </Typography>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  noWrap
                                  sx={{ color: "white", fontWeight: 500 }}
                                >
                                  {t.trackName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  noWrap
                                  color="text.secondary"
                                >
                                  {t.artistName}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ whiteSpace: "nowrap", ml: 1 }}
                            >
                              {t.playCount} plays
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </>
              )}

              {/* Divider */}
              <Box
                sx={{
                  height: "1px",
                  mx: -2,
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                  mb: 4,
                }}
              />

              {/* Actions */}
              <Stack spacing={2}>
                {spotifyConnected && profile?.external_urls?.spotify && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<MusicNote />}
                    href={profile.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
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
                    Open Spotify Profile
                  </Button>
                )}

                {spotifyConnected && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Refresh />}
                    onClick={handleConnect}
                    sx={{
                      borderRadius: 50,
                      fontWeight: 600,
                      borderColor: "rgba(255,255,255,0.12)",
                      color: "white",
                      "&:hover": { borderColor: "#1DB954", color: "#1DB954" },
                    }}
                  >
                    Reconnect Spotify
                  </Button>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Logout />}
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 50,
                    fontWeight: 600,
                    borderColor: "rgba(211,47,47,0.3)",
                    color: "#f44336",
                    "&:hover": {
                      borderColor: "#f44336",
                      bgcolor: "rgba(211,47,47,0.08)",
                    },
                  }}
                >
                  Log Out
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default ProfilePage;
