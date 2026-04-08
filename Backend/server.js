import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./src/configs/db.js";
import authRoutes  from "./src/routes/authRoutes.js";
import bikeRoutes  from "./src/routes/bikeRoutes.js";
import itemRoutes  from "./src/routes/itemRoutes.js";
import userRoutes  from "./src/routes/userRoutes.js";
import { errorHandler, notFound } from "./src/middlewares/errorHandler.js";




import dns from "dns";


dns.setServers(['8.8.8.8', '8.8.4.4']);



dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

connectDB();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      // Allowed conditions
      if (
        origin === "http://localhost:5173" ||
        origin.endsWith(".vercel.app") ||        // ← saare vercel subdomains
        origin === process.env.CLIENT_URL
      ) {
        return callback(null, true);
      }
      
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// OPTIONS preflight ke liye — CORS se pehle nahi, baad mein
app.options("*", cors());
app.use(cookieParser());
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.get("/api/health", (_, res) => res.json({ ok: true, env: process.env.NODE_ENV }));

app.use("/api/auth",  authRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/users", userRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (_, res) => res.sendFile(path.resolve(__dirname, "../client/dist/index.html")));
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🏍️  Server running on port ${PORT}`));
export default app;