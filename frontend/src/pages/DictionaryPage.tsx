import React, { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  Stack,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { BinarySearchTree } from "../utils/bst/BST";
import { RedBlackTree } from "../utils/bst/RedBlackTree";
import TreeVisualizer from "../components/Dictionary/TreeVisualizer";
import {
  getAllCachedSongs,
  addManualSong,
  getCurrentTrack,
  getLyrics,
} from "../services/spotifyService";
import { useAuth } from "../context/AuthContext";

const DictionaryPage: React.FC = () => {
  const { user } = useAuth();

  // --- DATA STRUCTURES ---
  const bstRef = useRef(new BinarySearchTree());
  const rbtRef = useRef(new RedBlackTree());

  // --- STATE ---
  const [version, setVersion] = useState(0);
  const [viewMode, setViewMode] = useState<"BST" | "RBT">("BST");

  // NEW: Tree Build Mode (Title vs Artist)
  const [buildMode, setBuildMode] = useState<"TITLE" | "ARTIST">("TITLE");

  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteQuery, setDeleteQuery] = useState("");

  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");
  const [highlightKeys, setHighlightKeys] = useState<string[]>([]);

  // --- ANIMATION STATE ---
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = () => setVersion((v) => v + 1);

  // --- CLEANUP ANIMATION TIMEOUTS ON UNMOUNT ---
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // --- ANIMATE INSERTION PATH ---
  const animateInsertionPath = async (keyToInsert: string) => {
    setIsAnimating(true);
    const tree = viewMode === "BST" ? bstRef.current : rbtRef.current;
    const path = tree.getInsertionPath(keyToInsert);

    // Wait for tree to render before starting animation
    await new Promise((resolve) => {
      animationTimeoutRef.current = setTimeout(resolve, 300);
    });

    // Accumulate path nodes - keep all visited nodes highlighted
    const accumulatedPath: string[] = [];
    for (let i = 0; i < path.length; i++) {
      accumulatedPath.push(path[i].key);
      console.log(
        "Highlighting path node:",
        path[i].key,
        "accumulated:",
        accumulatedPath
      );
      // Force synchronous render to ensure each step is visible
      flushSync(() => {
        setHighlightKeys([...accumulatedPath]);
      });
      // Wait to see the highlight before moving to next node
      await new Promise((resolve) => {
        animationTimeoutRef.current = setTimeout(resolve, 800); // 800ms per node
      });
    }

    // Final highlight: show the newly inserted node in blue
    accumulatedPath.push(keyToInsert);
    console.log(
      "Final node:",
      keyToInsert,
      "all highlighted:",
      accumulatedPath
    );
    flushSync(() => {
      setHighlightKeys([...accumulatedPath]);
    });

    // Keep final state visible for 1 second
    await new Promise((resolve) => {
      animationTimeoutRef.current = setTimeout(resolve, 1000);
    });

    setIsAnimating(false);
  };

  // --- 1. LOAD DATABASE ---
  useEffect(() => {
    loadDatabase();
  }, [buildMode]);

  const loadDatabase = async () => {
    try {
      const res = (await getAllCachedSongs()) as any;
      const songs = res.data || [];

      bstRef.current = new BinarySearchTree();
      rbtRef.current = new RedBlackTree();

      songs.forEach((s: any) => {
        let key = "";
        if (buildMode === "TITLE") {
          key = s.trackName;
        } else {
          key = s.artistName;
        }

        bstRef.current.insert(key, "GREEN");
        rbtRef.current.insert(key);
      });

      refresh();
      setAlertMsg(
        `Loaded ${songs.length} songs by ${
          buildMode === "TITLE" ? "Title" : "Artist"
        }.`
      );
      setAlertType("success");
    } catch (e) {
      console.error(e);
    }
  };

  // --- 2. INSERT ---
  const handleInsert = async () => {
    if (!songName || !artistName) return;
    if (isAnimating) return; // Prevent multiple inserts during animation

    const keyToInsert = buildMode === "TITLE" ? songName : artistName;

    if (bstRef.current.search(keyToInsert)) {
      setAlertMsg(`Note: "${keyToInsert}" already exists in the tree.`);
      setAlertType("info");
      return;
    }

    try {
      await addManualSong(songName, artistName);
      bstRef.current.insert(keyToInsert, "BLUE");
      rbtRef.current.insert(keyToInsert);
      setAlertMsg(`Saved "${songName}" by "${artistName}"`);
      setAlertType("success");
      setSongName("");
      setArtistName("");
      refresh();

      // Animate the insertion path
      await animateInsertionPath(keyToInsert);
    } catch (err) {
      console.error(err);
      setAlertMsg("Failed to save to DB.");
      setAlertType("error");
      setIsAnimating(false);
    }
  };

  // --- 3. DELETE ---
  const handleDelete = () => {
    if (!deleteQuery) return;
    const tree = viewMode === "BST" ? bstRef.current : rbtRef.current;
    const nodeToDelete = tree.search(deleteQuery);

    if (nodeToDelete) {
      tree.delete(nodeToDelete);
      setAlertMsg(`Deleted "${deleteQuery}" from the tree.`);
      setAlertType("warning");
      setDeleteQuery("");
      setHighlightKeys([]);
      refresh();
    } else {
      setAlertMsg(`Could not find "${deleteQuery}" to delete.`);
      setAlertType("error");
    }
  };

  // --- 4. LOAD FROM SPOTIFY ---
  const loadLyricsFromSpotify = async (sorted: boolean) => {
    if (!user) return;
    setAlertMsg("Fetching lyrics...");
    try {
      const trackRes = (await getCurrentTrack(user._id)) as any;
      if (!trackRes.data || !trackRes.data.item) {
        setAlertMsg("Nothing playing on Spotify.");
        return;
      }
      const item = trackRes.data.item;
      const lyricRes = await getLyrics(
        item.name,
        item.artists[0],
        item.id,
        item.durationMs
      );
      const lyricsData = lyricRes.data as any;

      if (lyricsData && lyricsData.plainLyrics) {
        const rawText = lyricsData.plainLyrics;
        const words = rawText
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
          .toLowerCase()
          .split(/\s+/)
          .filter((w: string) => w.length > 0);

        bstRef.current = new BinarySearchTree();
        rbtRef.current = new RedBlackTree();

        if (sorted) words.sort();

        const limit = sorted ? 30 : 50;
        words.slice(0, limit).forEach((w: string) => {
          bstRef.current.insert(w, "GREEN");
          rbtRef.current.insert(w);
        });

        refresh();
        setAlertMsg(`Loaded lyrics for "${item.name}"`);
      } else {
        setAlertMsg("No lyrics found.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- 5. SEARCH WITH PATH ANIMATION ---
  const animateSearchPath = async (searchKey: string) => {
    setIsAnimating(true);
    const tree = viewMode === "BST" ? bstRef.current : rbtRef.current;
    const path = tree.getSearchPath(searchKey);

    // Wait for tree to render before starting animation
    await new Promise((resolve) => {
      animationTimeoutRef.current = setTimeout(resolve, 300);
    });

    // Accumulate path nodes - keep all visited nodes highlighted
    const accumulatedPath: string[] = [];
    for (let i = 0; i < path.length; i++) {
      accumulatedPath.push(path[i].key);
      console.log(
        "Searching path node:",
        path[i].key,
        "accumulated:",
        accumulatedPath
      );
      // Force synchronous render to ensure each step is visible
      flushSync(() => {
        setHighlightKeys([...accumulatedPath]);
      });
      // Wait to see the highlight before moving to next node
      await new Promise((resolve) => {
        animationTimeoutRef.current = setTimeout(resolve, 800); // 800ms per node
      });
    }

    setIsAnimating(false);
  };

  const handleSearch = () => {
    if (!searchQuery) {
      setHighlightKeys([]);
      return;
    }
    const tree = viewMode === "BST" ? bstRef.current : rbtRef.current;
    const results = tree.findAll(searchQuery);
    if (results.length > 0) {
      setAlertMsg(`Found ${results.length} matches`);
      setAlertType("success");
      animateSearchPath(searchQuery);
    } else {
      setAlertMsg(`"${searchQuery}" not found.`);
      setAlertType("info");
      setHighlightKeys([]);
    }
  };

  const currentTree = viewMode === "BST" ? bstRef.current : rbtRef.current;
  const height = currentTree.getHeight();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, pb: 10 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Song Library Tree
      </Typography>
      <Typography color="gray" sx={{ mb: 4 }}>
        Visualizing Database Indexing. Green = Saved | Blue = Just Added
      </Typography>

      <Snackbar
        open={!!alertMsg}
        autoHideDuration={4000}
        onClose={() => setAlertMsg(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={alertType}
          variant="filled"
          onClose={() => setAlertMsg(null)}
        >
          {alertMsg}
        </Alert>
      </Snackbar>

      <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
        {/* LEFT CONTROLS */}
        <Stack spacing={3} sx={{ minWidth: 320 }}>
          {/* Build Mode */}
          <Paper sx={{ p: 3, bgcolor: "#181818" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Build Tree By
            </Typography>
            <ToggleButtonGroup
              value={buildMode}
              exclusive
              onChange={(e, val) => val && setBuildMode(val)}
              fullWidth
              sx={{
                bgcolor: "#282828",
                borderRadius: "50px", // Round container
                p: "4px", // Padding for "floating" look
                border: "1px solid #333",
              }}
            >
              <ToggleButton
                value="TITLE"
                sx={{
                  borderRadius: "50px !important", // Force round
                  border: "none",
                  textTransform: "none",
                  fontWeight: "bold",
                  color: "gray",
                  "&.Mui-selected": {
                    color: "black",
                    bgcolor: "#1DB954",
                    "&:hover": { bgcolor: "#1ed760" },
                  },
                }}
              >
                Song Title
              </ToggleButton>
              <ToggleButton
                value="ARTIST"
                sx={{
                  borderRadius: "50px !important",
                  border: "none",
                  textTransform: "none",
                  fontWeight: "bold",
                  color: "gray",
                  "&.Mui-selected": {
                    color: "black",
                    bgcolor: "#1DB954",
                    "&:hover": { bgcolor: "#1ed760" },
                  },
                }}
              >
                Artist Name
              </ToggleButton>
            </ToggleButtonGroup>
          </Paper>

          {/* Insert */}
          <Paper sx={{ p: 3, bgcolor: "#181818" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Add User Song
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Song Name"
                variant="outlined"
                size="small"
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
                sx={{ bgcolor: "#222" }}
              />
              <TextField
                label="Artist Name"
                variant="outlined"
                size="small"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                sx={{ bgcolor: "#222" }}
              />
              <Button variant="contained" color="info" onClick={handleInsert}>
                Save & Insert (Blue)
              </Button>
            </Stack>
          </Paper>

          {/* Search & Delete */}
          <Paper sx={{ p: 3, bgcolor: "#181818" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Manage Tree
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="gray">
                  SEARCH
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label={buildMode === "TITLE" ? "Song Title" : "Artist Name"}
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ bgcolor: "#222" }}
                  />
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={handleSearch}
                  >
                    Find
                  </Button>
                </Stack>
              </Box>

              <Box>
                <Typography variant="caption" color="gray">
                  DELETE
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Exact Name to Delete"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={deleteQuery}
                    onChange={(e) => setDeleteQuery(e.target.value)}
                    sx={{ bgcolor: "#222" }}
                  />
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: "#181818" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Algorithms Lab
            </Typography>
            <Stack spacing={1}>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => loadLyricsFromSpotify(false)}
              >
                Load Lyrics (Natural)
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => loadLyricsFromSpotify(true)}
              >
                Load Lyrics (Sorted)
              </Button>
            </Stack>
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="caption" color="gray">
                TREE HEIGHT
              </Typography>
              <Typography variant="h3" color="primary">
                {height}
              </Typography>
            </Box>
          </Paper>
        </Stack>

        {/* RIGHT VISUALIZER */}
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            {/* --- FIXED TOGGLE GROUP --- */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, val) => val && setViewMode(val)}
              sx={{
                bgcolor: "#282828",
                borderRadius: "50px",
                p: "4px",
                border: "1px solid #333",
              }}
            >
              <ToggleButton
                value="BST"
                sx={{
                  borderRadius: "50px !important",
                  border: "none",
                  px: 3,
                  fontWeight: "bold",
                  textTransform: "none",
                  color: "gray",
                  "&.Mui-selected": {
                    color: "black",
                    bgcolor: "#1DB954", // Green for Standard
                    "&:hover": { bgcolor: "#1ed760" },
                  },
                }}
              >
                Standard BST
              </ToggleButton>
              <ToggleButton
                value="RBT"
                sx={{
                  borderRadius: "50px !important",
                  border: "none",
                  px: 3,
                  fontWeight: "bold",
                  textTransform: "none",
                  color: "gray",
                  "&.Mui-selected": {
                    color: "white",
                    bgcolor: "#FF5252", // Red for Red-Black
                    "&:hover": { bgcolor: "#ff7b7b" },
                  },
                }}
              >
                Red-Black Tree
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TreeVisualizer
            root={currentTree.root}
            highlightKeys={highlightKeys}
            version={version}
            isAnimating={isAnimating}
          />
        </Box>
      </Stack>
    </Container>
  );
};

export default DictionaryPage;
