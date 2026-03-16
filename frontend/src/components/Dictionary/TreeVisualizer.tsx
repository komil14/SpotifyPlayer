import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
  version = 0,
  isAnimating = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const NODE_RADIUS = 28;
  const Y_SPACING = 120;
  const MIN_NODE_GAP = 60;
  const FIT_PADDING = 120;

  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragCenter = useRef({ x: 0, y: 0 });

  const layout = useMemo(() => {
    if (!root) {
      return {
        nodes: [] as Array<{
          id: number;
          label: string;
          x: number;
          y: number;
          color: string;
          glow: string;
        }>,
        edges: [] as Array<{
          id: string;
          x1: number;
          y1: number;
          x2: number;
          y2: number;
        }>,
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
        center: { x: 0, y: 0 },
      };
    }

    const positionMap = new Map<number, { x: number; y: number }>();

    const getSubtreeWidth = (node: TreeNode | null): number => {
      if (!node) return 0;
      const leftW = getSubtreeWidth(node.left);
      const rightW = getSubtreeWidth(node.right);
      return Math.max(MIN_NODE_GAP, leftW + rightW + 40);
    };

    const calculatePositions = (node: TreeNode, startX: number, y: number) => {
      positionMap.set(node._id, { x: 0, y });

      const leftWidth = getSubtreeWidth(node.left);
      let myX = startX;

      if (node.left && node.right) {
        const leftRootX = calculatePositions(node.left, startX, y + Y_SPACING);
        const rightRootX = calculatePositions(
          node.right,
          startX + leftWidth,
          y + Y_SPACING,
        );
        myX = (leftRootX + rightRootX) / 2;
      } else if (node.left) {
        const leftRootX = calculatePositions(node.left, startX, y + Y_SPACING);
        myX = leftRootX + 20;
      } else if (node.right) {
        const rightRootX = calculatePositions(node.right, startX, y + Y_SPACING);
        myX = rightRootX - 20;
      } else {
        myX = startX + (NODE_RADIUS * 2 + 40) / 2;
      }

      positionMap.set(node._id, { x: myX, y });
      return myX;
    };

    calculatePositions(root, 0, 0);

    const nodesToDraw: Array<{
      id: number;
      label: string;
      x: number;
      y: number;
      color: string;
      glow: string;
    }> = [];
    const edgesToDraw: Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

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
        id: node._id,
        label: node.key,
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

    const xs = nodesToDraw.map((node) => node.x);
    const ys = nodesToDraw.map((node) => node.y);
    const bounds = {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };

    return {
      nodes: nodesToDraw,
      edges: edgesToDraw,
      bounds,
      center: {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      },
    };
  }, [root]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateViewport = () => {
      if (!containerRef.current) return;
      setViewport({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const baseView = useMemo(() => {
    const width = Math.max(
      layout.bounds.maxX - layout.bounds.minX + NODE_RADIUS * 2 + FIT_PADDING * 2,
      300,
    );
    const height = Math.max(
      layout.bounds.maxY - layout.bounds.minY + NODE_RADIUS * 2 + FIT_PADDING * 2,
      300,
    );

    if (viewport.width <= 1 || viewport.height <= 1) {
      return { width, height };
    }

    const viewportRatio = viewport.width / viewport.height;
    const treeRatio = width / height;

    if (treeRatio > viewportRatio) {
      return { width, height: width / viewportRatio };
    }

    return { width: height * viewportRatio, height };
  }, [FIT_PADDING, NODE_RADIUS, layout.bounds, viewport.height, viewport.width]);

  const fitTreeToViewport = useCallback(() => {
    if (layout.nodes.length === 0) return;
    setCenter(layout.center);
    setZoom(1);
  }, [layout.center, layout.nodes.length]);

  useEffect(() => {
    if (layout.nodes.length === 0) return;

    if (highlightKeys.length > 0) {
      if (isAnimating) {
        const targetLabel = highlightKeys[highlightKeys.length - 1];
        const targetNode = layout.nodes.find((node) => node.label === targetLabel);
        if (targetNode) {
          setCenter({ x: targetNode.x, y: targetNode.y });
          setZoom(2.2);
        }
        return;
      }

      if (highlightKeys.length === 1) {
        const targetNode = layout.nodes.find(
          (node) => node.label === highlightKeys[0],
        );
        if (targetNode) {
          setCenter({ x: targetNode.x, y: targetNode.y });
          setZoom(2);
        }
      }
      return;
    }

    const frame = requestAnimationFrame(() => {
      fitTreeToViewport();
    });

    return () => cancelAnimationFrame(frame);
  }, [fitTreeToViewport, highlightKeys, isAnimating, layout.nodes, version]);

  const viewBox = useMemo(() => {
    const width = baseView.width / zoom;
    const height = baseView.height / zoom;
    return {
      x: center.x - width / 2,
      y: center.y - height / 2,
      width,
      height,
    };
  }, [baseView.height, baseView.width, center.x, center.y, zoom]);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const direction = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((current) => Math.min(Math.max(current * direction, 0.35), 6));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragCenter.current = center;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || viewport.width <= 1 || viewport.height <= 1) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const worldDx = (dx / viewport.width) * viewBox.width;
    const worldDy = (dy / viewport.height) * viewBox.height;

    setCenter({
      x: dragCenter.current.x - worldDx,
      y: dragCenter.current.y - worldDy,
    });
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
            onClick={() => setZoom((current) => Math.min(current * 1.2, 6))}
          >
            <Add />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton
            size="small"
            sx={{ color: "white" }}
            onClick={() => setZoom((current) => Math.max(current * 0.85, 0.35))}
          >
            <Remove />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fit Tree">
          <IconButton size="small" sx={{ color: "white" }} onClick={fitTreeToViewport}>
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

      <svg
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ touchAction: "none" }}
      >
        <AnimatePresence>
          {layout.edges.map((edge) => (
            <motion.line
              key={edge.id}
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

          {layout.nodes.map((node) => {
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
              >
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
                    ? `${node.label.substring(0, 12)}..`
                    : node.label}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
    </Box>
  );
};

export default TreeVisualizer;
