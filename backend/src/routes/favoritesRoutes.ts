import express from "express";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
} from "../controllers/favoritesController";

const router = express.Router();

// GET  /api/favorites          — Get all favorites for user
router.get("/", getFavorites);

// POST /api/favorites          — Add to favorites
router.post("/", addFavorite);

// GET  /api/favorites/check/:trackId — Check if track is favorited
router.get("/check/:trackId", checkFavorite);

// DELETE /api/favorites/:trackId    — Remove from favorites
router.delete("/:trackId", removeFavorite);

export default router;
