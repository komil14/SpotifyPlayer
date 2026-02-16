import React, { useMemo, useState, useRef, useEffect } from "react";
import { TreeNode } from "../../utils/bst/BST";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Add, Remove, CenterFocusStrong } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  root: TreeNode | null;
  highlightKeys?: string[];
  version?: number;
  isAnimating?: boolean;
}

const TreeVisualizer: React.FC<Props> = ({
  root,
  highlightKeys = [],
  version,
  isAnimating = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // --- SETTINGS ---
  const NODE_RADIUS = 28;
  const Y_SPACING = 120;
  const MIN_NODE_GAP = 60;

  // --- ZOOM/PAN STATE ---
  const [zoom, setZoom] = useState(0.6);
  const [offset, setOffset] = useState({ x: 0, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // --- LAYOUT ENGINE ---
  const layout = useMemo(() => {
    if (!root) return { nodes: [], edges: [], rootX: 0 };

    // Map by ID for drawing lines
    const positionMap = new Map<number, { x: number; y: number }>();

    // 1. Calculate Widths
    const getSubtreeWidth = (node: TreeNode | null): number => {
      if (!node) return 0;
      const leftW = getSubtreeWidth(node.left);
      const rightW = getSubtreeWidth(node.right);
      return Math.max(MIN_NODE_GAP, leftW + rightW + 40);
    };

    // 2. Calculate Positions
    const calculatePositions = (node: TreeNode, startX: number, y: number) => {
      positionMap.set(node._id, { x: 0, y });

      const leftWidth = getSubtreeWidth(node.left);
      const rightWidth = getSubtreeWidth(node.right);

      let myX = startX;

      if (node.left && node.right) {
        const leftRootRelX = calculatePositions(
          node.left,
          startX,
          y + Y_SPACING
        );
        const rightRootRelX = calculatePositions(
          node.right,
          startX + leftWidth,
          y + Y_SPACING
        );
        myX = (leftRootRelX + rightRootRelX) / 2;
      } else if (node.left) {
        const leftRootRelX = calculatePositions(
          node.left,
          startX,
          y + Y_SPACING
        );
        myX = leftRootRelX + 20;
      } else if (node.right) {
        const rightRootRelX = calculatePositions(
          node.right,
          startX,
          y + Y_SPACING
        );
        myX = rightRootRelX - 20;
      } else {
        myX = startX + (NODE_RADIUS * 2 + 40) / 2;
      }

      positionMap.set(node._id, { x: myX, y });
      return myX;
    };

    const rootX = calculatePositions(root, 0, 0);

    // 3. Generate Draw Objects
    const nodesToDraw: any[] = [];
    const edgesToDraw: any[] = [];

    const traverseAndCollect = (node: TreeNode) => {
      const pos = positionMap.get(node._id);
      if (!pos) return;

      let fillColor = "#1DB954";
      let glowColor = "rgba(29, 185, 84, 0.6)";
      if (node.color === "RED") {
        fillColor = "#FF5252";
        glowColor = "rgba(255, 82, 82, 0.6)";
      } else if (node.color === "BLACK") {
        fillColor = "#222";
        glowColor = "rgba(0,0,0,0.5)";
      } else if (node.color === "BLUE") {
        fillColor = "#2E86AB";
        glowColor = "rgba(46, 134, 171, 0.9)";
      }

      nodesToDraw.push({
        id: node._id, // Use unique ID for React Keys
        label: node.key, // Use Name for Display & Search
        x: pos.x,
        y: pos.y,
        color: fillColor,
        glow: glowColor,
      });

      if (node.left) {
        const childPos = positionMap.get(node.left._id);
        if (childPos) {
          edgesToDraw.push({
            id: `${node._id}-L`,
            x1: pos.x,
            y1: pos.y,
            x2: childPos.x,
            y2: childPos.y,
          });
          traverseAndCollect(node.left);
        }
      }

      if (node.right) {
        const childPos = positionMap.get(node.right._id);
        if (childPos) {
          edgesToDraw.push({
            id: `${node._id}-R`,
            x1: pos.x,
            y1: pos.y,
            x2: childPos.x,
            y2: childPos.y,
          });
          traverseAndCollect(node.right);
        }
      }
    };

    traverseAndCollect(root);

    return { nodes: nodesToDraw, edges: edgesToDraw, rootX };
  }, [root, version]);

  // --- AUTO FOCUS / SEARCH ---
  useEffect(() => {
    // Check if we have highlight keys and nodes
    if (
      highlightKeys &&
      highlightKeys.length > 0 &&
      containerRef.current &&
      layout.nodes.length > 0
    ) {
      // During animation, zoom to the LAST (most recent) highlighted node
      if (isAnimating && highlightKeys.length > 0) {
        const targetLabel = highlightKeys[highlightKeys.length - 1];
        const targetNode = layout.nodes.find(
          (n: any) => n.label === targetLabel
        );

        if (targetNode) {
          const centerX = containerRef.current.offsetWidth / 2;
          const centerY = containerRef.current.offsetHeight / 2;

          setOffset({
            x: centerX - targetNode.x,
            y: centerY - targetNode.y,
          });
          setZoom(1);
        }
        return;
      }

      // If multiple nodes highlighted but NOT animating, don't zoom in
      if (highlightKeys.length > 1) {
        return;
      }

      // Single node highlight - zoom in on it
      const targetLabel = highlightKeys[0];

      const targetNode = layout.nodes.find((n: any) => n.label === targetLabel);

      if (targetNode) {
        const centerX = containerRef.current.offsetWidth / 2;
        const centerY = containerRef.current.offsetHeight / 2;

        setOffset({
          x: centerX - targetNode.x,
          y: centerY - targetNode.y,
        });
        setZoom(1);
      }
    } else if (
      containerRef.current &&
      layout.nodes.length > 0 &&
      highlightKeys.length === 0
    ) {
      // Only center on root if we are NOT searching
      const centerX = containerRef.current.offsetWidth / 2;
      setOffset({ x: centerX - (layout.rootX || 0), y: 120 });
    }
  }, [highlightKeys, layout.nodes, layout.rootX, isAnimating]);

  // --- MOUSE HANDLERS ---
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const scaleAmount = -e.deltaY * 0.001;
    setZoom((z) => Math.min(Math.max(0.1, z + scaleAmount), 2));
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };
  const handleReset = () => {
    if (containerRef.current) {
      setZoom(0.6);
      setOffset({
        x: containerRef.current.offsetWidth / 2 - (layout.rootX || 0),
        y: 120,
      });
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        height: "750px",
        border: "1px solid #333",
        borderRadius: "16px",
        bgcolor: "#050505",
        overflow: "hidden",
        position: "relative",
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: "inset 0 0 60px rgba(0,0,0,0.8)",
        backgroundImage: "radial-gradient(#222 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* Controls */}
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          right: 20,
          display: "flex",
          gap: 1,
          bgcolor: "rgba(20,20,20,0.9)",
          borderRadius: 3,
          p: 1,
          zIndex: 10,
          border: "1px solid #333",
        }}
      >
        <Tooltip title="Zoom In">
          <IconButton
            size="small"
            sx={{ color: "white" }}
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
          >
            <Add />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton
            size="small"
            sx={{ color: "white" }}
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.1))}
          >
            <Remove />
          </IconButton>
        </Tooltip>
        <Tooltip title="Center">
          <IconButton
            size="small"
            sx={{ color: "white" }}
            onClick={handleReset}
          >
            <CenterFocusStrong />
          </IconButton>
        </Tooltip>
      </Box>

      {!root && (
        <Typography
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#444",
            fontWeight: "bold",
          }}
        >
          LOAD DATA TO START
        </Typography>
      )}

      <motion.svg width="100%" height="100%" style={{ touchAction: "none" }}>
        <motion.g
          initial={false}
          animate={{ x: offset.x, y: offset.y, scale: zoom }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <AnimatePresence>
            {/* 1. EDGES */}
            {layout.edges.map((edge, i) => (
              <motion.line
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1.5"
              />
            ))}

            {/* 2. NODES */}
            {layout.nodes.map((node) => {
              // Check if 'node.label' (The Name) is in the highlight list
              const isHighlighted = highlightKeys.includes(node.label);

              return (
                <motion.g
                  key={node.id}
                  initial={{ scale: 0 }}
                  animate={{
                    x: node.x,
                    y: node.y,
                    scale: isHighlighted ? 1.3 : 1,
                  }}
                  exit={{ scale: 0 }}
                  layout
                >
                  {/* Gold Ring for Matches */}
                  {isHighlighted && (
                    <circle
                      r={NODE_RADIUS + 8}
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="4"
                      style={{ filter: "drop-shadow(0 0 15px #FFD700)" }}
                    />
                  )}

                  <circle
                    r={NODE_RADIUS + 4}
                    fill={node.glow}
                    style={{ filter: "blur(8px)" }}
                  />
                  <circle
                    r={NODE_RADIUS}
                    fill={node.color}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="2"
                  />

                  <text
                    dy=".3em"
                    textAnchor="middle"
                    fill="white"
                    fontSize={node.label.length > 12 ? "9px" : "11px"}
                    fontWeight="bold"
                    style={{
                      pointerEvents: "none",
                      textShadow: "0px 2px 4px black",
                    }}
                  >
                    {node.label.length > 15
                      ? node.label.substring(0, 12) + ".."
                      : node.label}
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>
        </motion.g>
      </motion.svg>
    </Box>
  );
};

export default TreeVisualizer;
