import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// A fixed, valid ObjectId for your single admin account
const ADMIN_OBJECT_ID = new mongoose.Types.ObjectId("000000000000000000000001");

export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      _id: ADMIN_OBJECT_ID,          // ✅ Valid ObjectId — no more CastError
      name: process.env.ADMIN_NAME || "Admin",
      username: process.env.ADMIN_USERNAME,
      role: decoded.role || "admin",
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    next();
  };
};