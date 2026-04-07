import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const logPrefix = "[MongoDB]";

const connectDB = async () => {
  mongoose.connection.on("disconnected", () => {
    console.warn(`${logPrefix} Disconnected`);
  });

  mongoose.connection.on("error", (err) => {
    console.error(`${logPrefix} Connection error:`, err.message);
  });

  try {
    console.log(`${logPrefix} Connecting...`);
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are defaults in Mongoose 7+, kept for clarity
    });
    console.log(`${logPrefix} Ready · host: ${conn.connection.host} · db: ${conn.connection.name}`);
  } catch (error) {
    console.error(`${logPrefix} Failed to connect:`, error.message);
    process.exit(1);
  }
};

export default connectDB;