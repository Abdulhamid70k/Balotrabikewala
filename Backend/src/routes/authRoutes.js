// ─── authRoutes.js ────────────────────────────────────────────────────────────
import express from "express";
import {  login, logout, refreshToken, getMe } from "../controllers/AuthController.js";
import { protect } from "../middlewares/authMiddleware.js";
import cookieParser from "cookie-parser";

const router = express.Router();
router.use(cookieParser());


router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;