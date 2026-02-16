import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const MONGO_URI =
      process.env.MONGO_URL ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/spotify-app";

    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("✗ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;
