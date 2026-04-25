import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import dns from "dns";

import connectDB from "./src/configs/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import bikeRoutes from "./src/routes/bikeRoutes.js";
import itemRoutes from "./src/routes/itemRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import publicRoutes from "./src/routes/publicRoutes.js";
import { errorHandler, notFound } from "./src/middlewares/errorHandler.js";

// ==================== ENV ====================
dotenv.config();

// ==================== DNS FIX FOR RENDER/MONGO ====================
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// ==================== DB CONNECT ====================
connectDB();

const app = express();

// ==================== TRUST PROXY ====================
app.set("trust proxy", 1);

// ==================== SECURITY ====================
app.use(helmet());

// ==================== ALLOWED ORIGINS ====================
const allowedOrigins = [
  "http://localhost:5173", // Admin Local
  "http://localhost:5174", // Customer Local

  "https://balotrabikewala.vercel.app", // Admin Production
  "https://balotrabikewalacustomer.vercel.app", // Customer Production

  process.env.CLIENT_URL,
  process.env.CUSTOMER_URL,
];

// ==================== CORS ====================
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    console.log(`❌ CORS blocked for origin: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ==================== RATE LIMIT ====================
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
  })
);

// ==================== BODY PARSER ====================
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ==================== LOGGER ====================
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ==================== HEALTH CHECK ====================
app.get("/api/health", (_, res) => {
  res.status(200).json({
    success: true,
    message: "Balotra BikeWala Backend Running 🚀",
    env: process.env.NODE_ENV,
    time: new Date(),
  });
});

// ==================== ROUTES ====================

// Auth Routes
app.use("/api/auth", authRoutes);

// Admin Protected Routes (middleware inside routes recommended)
app.use("/api/bikes", bikeRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/users", userRoutes);

// Customer Public Routes
app.use("/api/public", publicRoutes);

// ==================== 404 ====================
app.use(notFound);

// ==================== ERROR HANDLER ====================
app.use(errorHandler);

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🏍️ Balotra BikeWala Server running on port ${PORT}`);
});

export default app;