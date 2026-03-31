import User from "../models/user.js";
import cloudinary from "../config/cloudinary.js";

// @desc    Get all users
// @route   GET /api/users
// @access  Admin only
export const getAllUsers = async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip  = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().select("-password -refreshToken").sort("-createdAt").skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin only
export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({ success: true, data: user });
};

// @desc    Update own profile (name, avatar)
// @route   PUT /api/users/profile
// @access  Private (own user)
export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Update allowed fields only
  if (req.body.name) user.name = req.body.name.trim();

  // Handle avatar upload (if file uploaded via multer)
  if (req.file) {
    // Delete old avatar from Cloudinary
    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }
    user.avatar = {
      public_id: req.file.filename,
      url: req.file.path,
    };
  }

  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      _id:    user._id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      avatar: user.avatar,
    },
  });
};

// @desc    Change own password
// @route   PUT /api/users/change-password
// @access  Private (own user)
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Both currentPassword and newPassword are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters",
    });
  }

  // Fetch password field (selected: false in schema)
  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Current password is incorrect" });
  }

  user.password = newPassword; // pre-save hook will hash it
  await user.save();

  res.json({ success: true, message: "Password changed successfully" });
};

// @desc    Toggle user active/inactive (admin)
// @route   PATCH /api/users/:id/toggle
// @access  Admin only
export const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "Aap apne aap ko deactivate nahi kar sakte" });
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
    data: { _id: user._id, name: user.name, isActive: user.isActive },
  });
};

// @desc    Change user role (admin only)
// @route   PATCH /api/users/:id/role
// @access  Admin only
export const changeUserRole = async (req, res) => {
  const { role } = req.body;

  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role. Use 'admin' or 'user'" });
  }

  // Prevent admin from changing their own role
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "Aap apna khud ka role nahi badal sakte" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({
    success: true,
    message: `User role changed to '${role}'`,
    data: user,
  });
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Admin only
export const deleteUser = async (req, res) => {
  // Prevent admin from deleting themselves
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "Aap apna khud ka account delete nahi kar sakte" });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Delete avatar from Cloudinary
  if (user.avatar?.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
  }

  await user.deleteOne();

  res.json({ success: true, message: "User deleted successfully" });
};