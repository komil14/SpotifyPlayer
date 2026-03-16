import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { getPlaylists, getSpotifyLoginUrl } from "../services/spotifyService";
import { useNavigate } from "react-router-dom";
import MiniPlayer from "../components/Player/MiniPlayer";
import { motion } from "framer-motion";
import SpotifyConnectPrompt from "../components/Spotify/SpotifyConnectPrompt";
import { useSpotifyConnection } from "../hooks/useSpotifyConnection";

const PlaylistsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { spotifyConnected, loading: connectionLoading } = useSpotifyConnection(
    user?._id,
  );

  useEffect(() => {
    const loadPlaylists = async () => {
      if (!user || !spotifyConnected) {
        setPlaylists([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = (await getPlaylists(user._id)) as any;
        setPlaylists(res.data || []);
      } catch (error) {
        console.error("Failed to load playlists", error);
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };

    if (!connectionLoading) {
      loadPlaylists();
    }
  }, [connectionLoading, spotifyConnected, user]);

  const handleConnect = async () => {
    try {
      window.location.href = await getSpotifyLoginUrl();
    } catch (error) {
      console.error("Failed to start Spotify login", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 12 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Your Library
      </Typography>

      {!connectionLoading && !spotifyConnected ? (
        <Box sx={{ mt: 4 }}>
          <SpotifyConnectPrompt
            title="Playlists Need Spotify"
            description="This page imports your Spotify playlists. Connect your account to browse them here, or keep using the public dictionary and lyrics tools without it."
            onPrimaryAction={handleConnect}
            onSecondaryAction={() => navigate("/dictionary")}
          />
        </Box>
      ) : loading || connectionLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress sx={{ color: "#1DB954" }} />
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            mt: 4,
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
            },
          }}
        >
          {playlists.map((playlist, index) => (
            <Card
              key={playlist.id}
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -10 }}
              sx={{ borderRadius: 4, bgcolor: "#181818", height: "100%" }}
            >
              <CardActionArea
                onClick={() => navigate(`/playlist/${playlist.id}`)}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <Box sx={{ overflow: "hidden", width: "100%" }}>
                  <CardMedia
                    component="img"
                    image={
                      playlist.images?.[0]?.url || "https://via.placeholder.com/300"
                    }
                    alt={playlist.name}
                    sx={{
                      aspectRatio: "1/1",
                      objectFit: "cover",
                      transition: "0.3s",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                  />
                </Box>
                <CardContent sx={{ width: "100%" }}>
                  <Typography
                    gutterBottom
                    variant="h6"
                    noWrap
                    sx={{
                      color: "white",
                      fontSize: "1rem",
                      fontWeight: "bold",
                    }}
                  >
                    {playlist.name}
                  </Typography>
                  <Typography variant="body2" color="gray">
                    {playlist.tracks.total} Tracks
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      {user && spotifyConnected && <MiniPlayer userId={user._id} />}
    </Container>
  );
};

export default PlaylistsPage;
