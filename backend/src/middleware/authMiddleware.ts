import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  // Check for token in Authorization header
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const token = req.headers.authorization.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret",
    );

    // Add user id to request object
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
