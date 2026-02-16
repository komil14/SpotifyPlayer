import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

// Helper: Generate JWT Token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "defaultsecret", {
    expiresIn: "30d",
  });
};

// Helper: Validate email format
const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      res
        .status(400)
        .json({ message: "All fields are required (name, email, password)" });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
      return;
    }

    // 1. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user
    const user: IUser = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
    });

    // 4. Respond
    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
        message: "Phase 2 is Complete",
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    // 1. Check for user
    const user = await User.findOne({ email });

    // 2. Check password matches
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
        message: "Phase 2 is Complete",
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Refresh JWT token
// @route   POST /api/auth/refresh
// @access  Private (requires valid token)
export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    try {
      // Verify the existing token (even if close to expiry)
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "defaultsecret",
      ) as { id: string };

      // Check user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        res.status(401).json({ message: "User no longer exists" });
        return;
      }

      // Issue a fresh token
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
        message: "Token refreshed successfully",
      });
    } catch (jwtError) {
      res
        .status(401)
        .json({ message: "Token expired or invalid, please login again" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
