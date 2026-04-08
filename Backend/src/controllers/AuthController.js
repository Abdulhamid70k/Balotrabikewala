import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
} from "../utils/generateToken.js";

// LOGIN
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username aur password zaroori hai" });
    }

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = {
      _id: "admin_001",
      name: process.env.ADMIN_NAME || "Admin",
      role: "admin",
    };

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      data: { ...user, accessToken },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REFRESH
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token" });
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = { _id: "admin_001", role: "admin" };

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    setRefreshCookie(res, newRefreshToken);

    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    res.status(403).json({ success: false, message: "Invalid refresh token" });
  }
};

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none", // ⚠️ IMPORTANT for Vercel
  });

  res.json({ success: true });
};

// ME
export const getMe = (req, res) => {
  res.json({ success: true, data: req.user });
};