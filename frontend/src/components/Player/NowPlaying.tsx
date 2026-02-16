import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  CircularProgress,
  Slider,
  Tooltip,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Favorite,
  FavoriteBorder,
  Shuffle,
  Repeat,
  RepeatOne,
  VolumeUp,
  VolumeDown,
  VolumeMute,
  VolumeOff,
} from "@mui/icons-material";
import {
  getCurrentTrack,
  getLyrics,
  play,
  pause,
  next,
  previous,
  seek,
  setShuffle,
  setRepeat,
  setVolume as setVolumeApi,
  addFavorite,
  removeFavorite,
  checkFavorite,
  logPlay,
} from "../../services/spotifyService";
import { parseLRC, LyricLine } from "../../utils/lyricsParser";
import LyricsBox from "./LyricsBox";

const LATENCY_COMPENSATION = 1000;

const formatTime = (ms: number) => {
  if (ms < 0) ms = 0;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

interface TrackData {
  isPlaying: boolean;
  progressMs: number;
  item?: {
    id: string;
    name: string;
    artists: string[];
    albumArt: string;
    durationMs: number;
  };
  lyrics?: string | null;
}

interface LyricsResponse {
  syncedLyrics?: string;
  plainLyrics?: string;
}

interface Props {
  userId: string;
}

const NowPlaying: React.FC<Props> = ({ userId }) => {
  const [track, setTrack] = useState<TrackData | null>(null);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [noLyricsFound, setNoLyricsFound] = useState(false);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  // New feature states
  const [isFavorited, setIsFavorited] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "context" | "track">(
    "off",
  );
  const [volume, setVolume] = useState(50);
  const [showVolume, setShowVolume] = useState(false);

  const progressRef = useRef(0);
  const trackIdRef = useRef<string>("");
  const burstIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playLoggedRef = useRef<string>("");
  const volumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    progressRef.current = smoothProgress;
  }, [smoothProgress]);

  // --- POLLING LOGIC (Keep existing logic) ---
  const startBurstPolling = useCallback(() => {
    if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
    let attempts = 0;
    const targetId = trackIdRef.current;

    burstIntervalRef.current = setInterval(async () => {
      attempts++;
      const response = await getCurrentTrack(userId);
      const data = response.data as TrackData;

      if (data && data.item && data.item.id !== targetId) {
        setTrack(data);
        setSmoothProgress(data.progressMs);
        trackIdRef.current = data.item.id;
        setIsLoading(false);
        setNoLyricsFound(false);
        setLyrics([]);

        // Check favorite status for new track
        checkFavorite(userId, data.item.id)
          .then((r) => setIsFavorited((r.data as any).isFavorited))
          .catch(() => setIsFavorited(false));

        // Log play event
        if (playLoggedRef.current !== data.item.id) {
          playLoggedRef.current = data.item.id;
          logPlay({
            userId,
            spotifyTrackId: data.item.id,
            trackName: data.item.name,
            artistName: data.item.artists[0],
            albumArt: data.item.albumArt,
            durationMs: data.item.durationMs,
          }).catch(() => {});
        }

        if (data.lyrics) {
          setLyrics(parseLRC(data.lyrics));
          setIsLyricsLoading(false);
        } else {
          setIsLyricsLoading(true);
          fetchMissingLyrics(data.item);
        }

        if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
      } else if (data && data.isPlaying !== track?.isPlaying) {
        setTrack(data);
      }

      if (attempts >= 15 && burstIntervalRef.current)
        clearInterval(burstIntervalRef.current);
    }, 300);
  }, [userId, track]);

  const fetchMissingLyrics = async (item: any) => {
    try {
      const response = await getLyrics(
        item.name,
        item.artists[0],
        item.id,
        item.durationMs,
      );
      const data = response.data as LyricsResponse;

      if (data && data.syncedLyrics) {
        setLyrics(parseLRC(data.syncedLyrics));
        setNoLyricsFound(false);
      } else {
        setNoLyricsFound(true);
      }
    } catch (e) {
      setNoLyricsFound(true);
    } finally {
      setIsLyricsLoading(false);
    }
  };

  const fetchTrackStandard = useCallback(async () => {
    if (burstIntervalRef.current) return;
    const response = await getCurrentTrack(userId);
    const data = response.data as TrackData;
    if (data && data.item) {
      if (trackIdRef.current !== data.item.id) {
        setTrack(data);
        trackIdRef.current = data.item.id;
        setSmoothProgress(data.progressMs);
        setIsLoading(false);
        setNoLyricsFound(false);

        // Check favorite status for new track
        checkFavorite(userId, data.item.id)
          .then((r) => setIsFavorited((r.data as any).isFavorited))
          .catch(() => setIsFavorited(false));

        // Log play event
        if (playLoggedRef.current !== data.item.id) {
          playLoggedRef.current = data.item.id;
          logPlay({
            userId,
            spotifyTrackId: data.item.id,
            trackName: data.item.name,
            artistName: data.item.artists[0],
            albumArt: data.item.albumArt,
            durationMs: data.item.durationMs,
          }).catch(() => {});
        }
        if (data.lyrics) {
          setLyrics(parseLRC(data.lyrics));
          setIsLyricsLoading(false);
        } else {
          setIsLyricsLoading(true);
          fetchMissingLyrics(data.item);
        }
      } else {
        if (!isScrubbing) {
          const estTime = data.progressMs + LATENCY_COMPENSATION;
          if (Math.abs(progressRef.current - estTime) > 1500) {
            setSmoothProgress(estTime);
          }
        }
      }
    } else if (data && !data.isPlaying) {
      setTrack((prev) => (prev?.item ? { ...prev, isPlaying: false } : null));
    }
  }, [userId, isScrubbing]);

  useEffect(() => {
    fetchTrackStandard();
    const interval = setInterval(fetchTrackStandard, 3000);
    return () => clearInterval(interval);
  }, [fetchTrackStandard]);

  useEffect(() => {
    if (!track?.isPlaying || isScrubbing) return;
    const timer = setInterval(() => setSmoothProgress((p) => p + 500), 500);
    return () => clearInterval(timer);
  }, [track?.isPlaying, isScrubbing]);

  // --- HANDLERS ---
  const handlePlayPause = async () => {
    if (!track) return;
    if (track.isPlaying) {
      await pause(userId);
      setTrack({ ...track, isPlaying: false });
    } else {
      await play(userId);
      setTrack({ ...track, isPlaying: true });
    }
    startBurstPolling();
  };

  const handleNext = async () => {
    setIsLoading(true);
    setLyrics([]);
    setNoLyricsFound(false);
    await next(userId);
    startBurstPolling();
  };

  const handlePrev = async () => {
    setIsLoading(true);
    setLyrics([]);
    setNoLyricsFound(false);
    await previous(userId);
    startBurstPolling();
  };

  const handleScrubChange = (event: Event, newValue: number | number[]) => {
    setIsScrubbing(true);
    setScrubValue(newValue as number);
    setSmoothProgress(newValue as number);
  };

  const handleScrubCommit = async (
    event: Event | React.SyntheticEvent,
    newValue: number | number[],
  ) => {
    const finalMs = newValue as number;
    setSmoothProgress(finalMs);
    setIsScrubbing(false);
    try {
      await seek(userId, finalMs);
    } catch (err) {
      console.error("Seek failed:", err);
    }
    setTimeout(fetchTrackStandard, 500);
  };

  const handleLyricClick = async (startTime: number) => {
    setSmoothProgress(startTime);
    try {
      await seek(userId, startTime);
    } catch (err) {
      console.error("Seek failed:", err);
    }
    setTimeout(fetchTrackStandard, 500);
  };

  // --- FAVORITE HANDLER ---
  const handleToggleFavorite = async () => {
    if (!track?.item) return;
    const { id, name, artists, albumArt, durationMs } = track.item;
    try {
      if (isFavorited) {
        await removeFavorite(userId, id);
        setIsFavorited(false);
      } else {
        await addFavorite({
          userId,
          spotifyTrackId: id,
          trackName: name,
          artistName: artists[0],
          albumArt,
          durationMs,
        });
        setIsFavorited(true);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  };

  // --- SHUFFLE HANDLER ---
  const handleToggleShuffle = async () => {
    const newState = !shuffleOn;
    try {
      await setShuffle(userId, newState);
      setShuffleOn(newState);
    } catch (err) {
      console.error("Shuffle toggle failed:", err);
    }
  };

  // --- REPEAT HANDLER ---
  const handleCycleRepeat = async () => {
    const nextMap: Record<string, "off" | "context" | "track"> = {
      off: "context",
      context: "track",
      track: "off",
    };
    const nextState = nextMap[repeatMode];
    try {
      await setRepeat(userId, nextState);
      setRepeatMode(nextState);
    } catch (err) {
      console.error("Repeat toggle failed:", err);
    }
  };

  // --- VOLUME HANDLER (debounced) ---
  const handleVolumeChange = (_: Event, newVal: number | number[]) => {
    const v = newVal as number;
    setVolume(v);
    if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
    volumeTimerRef.current = setTimeout(async () => {
      try {
        await setVolumeApi(userId, v);
      } catch (err: any) {
        // Some devices don't support volume control — silently ignore
      }
    }, 300);
  };

  const VolumeIcon =
    volume === 0
      ? VolumeOff
      : volume < 30
        ? VolumeMute
        : volume < 70
          ? VolumeDown
          : VolumeUp;

  // --- RENDER ---
  if (isLoading || !track || !track.item) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
          gap: 4,
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="h6" color="text.secondary">
          Syncing Player...
        </Typography>
      </Box>
    );
  }

  const { name, artists, albumArt, durationMs } = track.item;
  const progressValue = isScrubbing ? scrubValue : smoothProgress;
  const currentTimeStr = formatTime(progressValue);
  const durationTimeStr = formatTime(durationMs);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 6,
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      {/* GLASSMORPHISM PLAYER CARD */}
      <Card
        sx={{
          width: 300,
          borderRadius: 8, // Rounded corners
          background: "rgba(255, 255, 255, 0.05)", // Glass transparency
          backdropFilter: "blur(20px)", // The blur magic
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          flexShrink: 0,
        }}
      >
        <CardMedia
          component="img"
          sx={{ width: "100%", aspectRatio: "1/1" }}
          image={albumArt}
        />
        <CardContent sx={{ textAlign: "left" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                noWrap
                sx={{ color: "white" }}
              >
                {name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {artists.join(", ")}
              </Typography>
            </Box>
            <Tooltip
              title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
            >
              <IconButton
                onClick={handleToggleFavorite}
                sx={{
                  ml: 1,
                  color: isFavorited ? "#1DB954" : "rgba(255,255,255,0.5)",
                  transition: "0.2s",
                  "&:hover": { transform: "scale(1.2)" },
                }}
              >
                {isFavorited ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>

        {/* Shuffle / Prev / Play-Pause / Next / Repeat */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pb: 1,
            gap: 0.5,
          }}
        >
          <Tooltip title={shuffleOn ? "Shuffle On" : "Shuffle Off"}>
            <IconButton
              onClick={handleToggleShuffle}
              sx={{
                color: shuffleOn ? "#1DB954" : "rgba(255,255,255,0.4)",
                fontSize: 20,
                "&:hover": { color: "#1DB954" },
              }}
            >
              <Shuffle fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            onClick={handlePrev}
            sx={{ color: "white", "&:hover": { color: "#1DB954" } }}
          >
            <SkipPrevious />
          </IconButton>
          <IconButton
            onClick={handlePlayPause}
            sx={{
              color: "white",
              "&:hover": { color: "#1DB954", transform: "scale(1.1)" },
              transition: "0.2s",
            }}
          >
            {track.isPlaying ? (
              <Pause sx={{ fontSize: 50 }} />
            ) : (
              <PlayArrow sx={{ fontSize: 50 }} />
            )}
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{ color: "white", "&:hover": { color: "#1DB954" } }}
          >
            <SkipNext />
          </IconButton>
          <Tooltip
            title={
              repeatMode === "off"
                ? "Repeat Off"
                : repeatMode === "context"
                  ? "Repeat All"
                  : "Repeat Track"
            }
          >
            <IconButton
              onClick={handleCycleRepeat}
              sx={{
                color:
                  repeatMode !== "off" ? "#1DB954" : "rgba(255,255,255,0.4)",
                "&:hover": { color: "#1DB954" },
              }}
            >
              {repeatMode === "track" ? (
                <RepeatOne fontSize="small" />
              ) : (
                <Repeat fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ px: 2, pb: 2 }}>
          <Slider
            size="small"
            value={progressValue}
            min={0}
            max={durationMs}
            onChange={handleScrubChange}
            onChangeCommitted={handleScrubCommit}
            sx={{
              color: "#1DB954",
              height: 4,
              padding: "0px",
              "& .MuiSlider-thumb": {
                width: 0,
                height: 0,
                transition: "0.2s",
                "&:before": { boxShadow: "0 2px 12px 0 rgba(0,0,0,0.4)" },
                "&.Mui-active": { width: 12, height: 12 },
              },
              "&:hover .MuiSlider-thumb": { width: 12, height: 12 },
              "& .MuiSlider-rail": {
                opacity: 0.28,
                backgroundColor: "#bfbfbf",
              },
            }}
          />
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              {currentTimeStr}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {durationTimeStr}
            </Typography>
          </Box>

          {/* Volume Control */}
          <Box sx={{ display: "flex", alignItems: "center", mt: 1.5, gap: 1 }}>
            <Tooltip title="Volume">
              <IconButton
                onClick={() => setShowVolume(!showVolume)}
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  p: 0.5,
                  "&:hover": { color: "#1DB954" },
                }}
              >
                <VolumeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {showVolume && (
              <Slider
                size="small"
                value={volume}
                min={0}
                max={100}
                onChange={handleVolumeChange}
                sx={{
                  color: "#1DB954",
                  height: 3,
                  flex: 1,
                  "& .MuiSlider-thumb": { width: 10, height: 10 },
                  "& .MuiSlider-rail": {
                    opacity: 0.28,
                    backgroundColor: "#bfbfbf",
                  },
                }}
              />
            )}
          </Box>
        </Box>
      </Card>

      {/* GLASSMORPHISM LYRICS BOX */}
      <Paper
        sx={{
          width: { xs: "100%", md: 450 },
          height: 500,
          borderRadius: 8,
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          position: "relative",
        }}
      >
        {lyrics.length > 0 ? (
          <LyricsBox
            lyrics={lyrics}
            progressMs={smoothProgress}
            onLineClick={handleLyricClick}
          />
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            {isLyricsLoading ? (
              <>
                <CircularProgress size={30} sx={{ mb: 2, color: "#1DB954" }} />
                <Typography color="text.secondary">
                  Fetching Lyrics...
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">
                {noLyricsFound
                  ? "No lyrics found for this track."
                  : "Waiting for lyrics..."}
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default NowPlaying;
