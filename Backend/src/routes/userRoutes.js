import express from "express";
import User from "../models/user.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(protect);

// GET all users — admin only
router.get("/", authorize("admin"), async (req, res) => {
  const users = await User.find().select("-password -refreshToken");
  res.json({ success: true, data: users });
});

// PATCH toggle user active status — admin only
router.patch("/:id/toggle", authorize("admin"), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}`, data: user });
});

export default router;