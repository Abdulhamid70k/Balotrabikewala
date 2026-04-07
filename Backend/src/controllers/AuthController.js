import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
} from "../utils/generateToken.js";

// @desc    Login — single account only
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username aur password zaroori hai" });
  }

  const validUsername = username === process.env.ADMIN_USERNAME;
  const validPassword = password === process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    return res.status(401).json({ success: false, message: "Username ya password galat hai" });
  }

  const user = {
    _id: "admin_001",
    name: process.env.ADMIN_NAME || "Admin",
    username: process.env.ADMIN_USERNAME,
    role: "admin",
  };

  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  setRefreshCookie(res, refreshToken);

  res.json({
    success: true,
    message: "Login successful",
    data: { ...user, accessToken },
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

    const user = {
      _id: "admin_001",
      name: process.env.ADMIN_NAME || "Admin",
      username: process.env.ADMIN_USERNAME,
      role: "admin",
    };

    const newAccessToken  = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

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