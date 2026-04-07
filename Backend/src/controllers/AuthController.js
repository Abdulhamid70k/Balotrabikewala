import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
} from "../utils/generateToken.js";

// Fixed valid ObjectId — "admin_001" ki jagah
const ADMIN_ID = new mongoose.Types.ObjectId("000000000000000000000001");

const ADMIN_USER = {
  _id: ADMIN_ID,
  name: process.env.ADMIN_NAME || "Admin",
  username: process.env.ADMIN_USERNAME,
  role: "admin",
};

// @desc    Login — single account only
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username aur password zaroori hai" });
  }

  // Username check
  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(401).json({ success: false, message: "Username ya password galat hai" });
  }

  // ✅ Bcrypt se compare — plaintext comparison nahi
  const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Username ya password galat hai" });
  }

  const accessToken  = generateAccessToken(ADMIN_USER._id, ADMIN_USER.role);
  const refreshToken = generateRefreshToken(ADMIN_USER._id);

  setRefreshCookie(res, refreshToken);

  res.json({
    success: true,
    message: "Login successful",
    data: { ...ADMIN_USER, accessToken },
  });
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: "No refresh token" });
  }

  try {
    jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const newAccessToken  = generateAccessToken(ADMIN_USER._id, ADMIN_USER.role);
    const newRefreshToken = generateRefreshToken(ADMIN_USER._id);

    setRefreshCookie(res, newRefreshToken);

    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch {
    res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ success: true, message: "Logged out successfully" });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = (req, res) => {
  res.json({ success: true, data: req.user });
};