import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// ─── Load environment variables FIRST ────────────────────────────
const envCandidates = [
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "../.env.production")
    : "",
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend/.env"),
].filter(Boolean);

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`✓ Loaded env from: ${envPath}`);
    break;
  }
}

import connectDB from "./config/db";

// ─── Import routes ───────────────────────────────────────────────
import authRoutes from "./routes/authRoutes";
import spotifyRoutes from "./routes/spotifyRoutes";
import lyricsRoutes from "./routes/lyricsRoutes";
import favoritesRoutes from "./routes/favoritesRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";

// ─── Initialize express app ─────────────────────────────────────
const app: Express = express();
const PORT = process.env.PORT || 5000;

// ─── Connect to database ────────────────────────────────────────
connectDB();

// ─── Global Middleware ───────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api/lyrics", lyricsRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/analytics", analyticsRoutes);

// ─── Health & Info ───────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Spotify App Backend API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      spotify: "/api/spotify",
      lyrics: "/api/lyrics",
      favorites: "/api/favorites",
      analytics: "/api/analytics",
      health: "/health",
    },
  });
});

// ─── Error handling middleware ────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err.message || err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── 404 handler ─────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── Start server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎵 Spotify App Backend Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✓ Server running on: http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

export default app;
