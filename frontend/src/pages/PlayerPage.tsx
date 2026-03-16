import React from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSpotifyLoginUrl } from "../services/spotifyService";
import NowPlaying from "../components/Player/NowPlaying";
import SpotifyConnectPrompt from "../components/Spotify/SpotifyConnectPrompt";
import { useSpotifyConnection } from "../hooks/useSpotifyConnection";

const PlayerPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { spotifyConnected, loading } = useSpotifyConnection(user?._id);

  if (!user) return null;

  const handleConnect = async () => {
    try {
      window.location.href = await getSpotifyLoginUrl();
    } catch (error) {
      console.error("Failed to start Spotify login", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8 }}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress sx={{ color: "#1DB954" }} />
        </Box>
      ) : !spotifyConnected ? (
        <SpotifyConnectPrompt
          title="Live Player Needs Spotify"
          description="The player syncs to your active Spotify session for transport controls, queue actions, and timed lyrics. Connect Spotify to unlock it."
          onPrimaryAction={handleConnect}
          onSecondaryAction={() => navigate("/dictionary")}
        />
      ) : (
        <NowPlaying userId={user._id} />
      )}
    </Container>
  );
};

export default PlayerPage;
