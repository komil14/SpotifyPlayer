import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  logPlay,
  getStats,
  getHistory,
} from "../controllers/analyticsController";

const router = express.Router();

router.use(protect);

// POST /api/analytics/log       — Log a play event
router.post("/log", logPlay);

// GET  /api/analytics/stats     — Get aggregated stats
router.get("/stats", getStats);

// GET  /api/analytics/history   — Get paginated play history
router.get("/history", getHistory);

export default router;
