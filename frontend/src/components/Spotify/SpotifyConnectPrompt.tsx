import React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import {
  AccountTree,
  Headphones,
  Link as LinkIcon,
  QueueMusic,
} from "@mui/icons-material";

interface Props {
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimaryAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

const SpotifyConnectPrompt: React.FC<Props> = ({
  title,
  description,
  primaryLabel = "Connect Spotify",
  onPrimaryAction,
  secondaryLabel = "Open Dictionary",
  onSecondaryAction,
}) => {
  return (
    <Paper
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 5,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(29,185,84,0.08) 100%)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
      >
        <LinkIcon sx={{ color: "#1DB954" }} />
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        {description}
      </Typography>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountTree sx={{ color: "#1DB954", fontSize: 18 }} />
          <Typography variant="body2" color="text.secondary">
            Dictionary and cached lyrics still work
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <QueueMusic sx={{ color: "#1DB954", fontSize: 18 }} />
          <Typography variant="body2" color="text.secondary">
            Connect Spotify for playlists and catalog search
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Headphones sx={{ color: "#1DB954", fontSize: 18 }} />
          <Typography variant="body2" color="text.secondary">
            Live player controls unlock after connection
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        {onPrimaryAction && (
          <Button
            variant="contained"
            onClick={onPrimaryAction}
            sx={{
              borderRadius: 50,
              bgcolor: "#1DB954",
              color: "#000",
              fontWeight: 700,
              "&:hover": { bgcolor: "#1ed760" },
            }}
          >
            {primaryLabel}
          </Button>
        )}
        {onSecondaryAction && (
          <Button
            variant="outlined"
            onClick={onSecondaryAction}
            sx={{
              borderRadius: 50,
              borderColor: "rgba(255,255,255,0.18)",
              color: "white",
              fontWeight: 600,
              "&:hover": { borderColor: "#1DB954", color: "#1DB954" },
            }}
          >
            {secondaryLabel}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default SpotifyConnectPrompt;
