import Bike from "../models/bike.js";
import cloudinary from "../configs/cloudnary.js";
import { uploadToCloudinary } from "../middlewares/uploadMiddleware.js";

// Helper: build query filters
const buildQuery = (queryParams, userId, userRole) => {
  const query = {};

  // Non-admins see only their own bikes
  if (userRole !== "admin") query.createdBy = userId;

  if (queryParams.status) query.status = queryParams.status;
  if (queryParams.search) query.$text = { $search: queryParams.search };

  return query;
};

// @desc    Get all bikes (with pagination + filters)
// @route   GET /api/bikes
// @access  Private
export const getBikes = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || "-createdAt";

  const query = buildQuery(req.query, req.user._id, req.user.role);

  const [bikes, total] = await Promise.all([
    Bike.find(query).sort(sortBy).skip(skip).limit(limit).populate("createdBy", "name email"),
    Bike.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: bikes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

// @desc    Get single bike
// @route   GET /api/bikes/:id
// @access  Private
export const getBike = async (req, res) => {
  const bike = await Bike.findById(req.params.id).populate("createdBy", "name email");

  if (!bike) {
    return res.status(404).json({ success: false, message: "Bike not found" });
  }

  // Non-admin can only see own bikes
  if (req.user.role !== "admin" && bike.createdBy._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  res.json({ success: true, data: bike });
};

// @desc    Create bike
// @route   POST /api/bikes
// @access  Private
export const createBike = async (req, res) => {
  const bikeData = { ...req.body, createdBy: req.user._id };

  // Handle uploaded images from Multer + Cloudinary
if (req.files?.length) {
  const uploadPromises = req.files.map((file) =>
    uploadToCloudinary(file.buffer)
  );
  const results = await Promise.all(uploadPromises);
  bikeData.images = results.map((result) => ({
    public_id: result.public_id,
    url: result.secure_url,
  }));
}
  const bike = await Bike.create(bikeData);
  res.status(201).json({ success: true, message: "Bike added successfully", data: bike });
};

// @desc    Update bike
// @route   PUT /api/bikes/:id
// @access  Private
export const updateBike = async (req, res) => {
  let bike = await Bike.findById(req.params.id);

  if (!bike) {
    return res.status(404).json({ success: false, message: "Bike not found" });
  }

  if (req.user.role !== "admin" && bike.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  // Handle new images
  if (req.files?.length) {
    const newImages = req.files.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
    req.body.images = [...(bike.images || []), ...newImages];
  }

  bike = await Bike.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, message: "Bike updated successfully", data: bike });
};

// @desc    Delete bike
// @route   DELETE /api/bikes/:id
// @access  Private (Admin only)
export const deleteBike = async (req, res) => {
  const bike = await Bike.findById(req.params.id);

  if (!bike) {
    return res.status(404).json({ success: false, message: "Bike not found" });
  }

  // Delete images from Cloudinary
  const deletePromises = bike.images.map((img) =>
    cloudinary.uploader.destroy(img.public_id)
  );
  await Promise.allSettled(deletePromises);

  await bike.deleteOne();
  res.json({ success: true, message: "Bike deleted successfully" });
};

// @desc    Delete single image from bike
// @route   DELETE /api/bikes/:id/images/:imageId
// @access  Private
export const deleteImage = async (req, res) => {
  const bike = await Bike.findById(req.params.id);
  if (!bike) return res.status(404).json({ success: false, message: "Bike not found" });

  const image = bike.images.find((img) => img.public_id === req.params.imageId);
  if (!image) return res.status(404).json({ success: false, message: "Image not found" });

  await cloudinary.uploader.destroy(req.params.imageId);
  bike.images = bike.images.filter((img) => img.public_id !== req.params.imageId);
  await bike.save();

  res.json({ success: true, message: "Image deleted", data: bike });
};

// @desc    Dashboard stats + reports
// @route   GET /api/bikes/stats
// @access  Private
export const getStats = async (req, res) => {
  const userId = req.user.role === "admin" ? null : req.user._id;
  const matchStage = userId ? { createdBy: userId } : {};

  const stats = await Bike.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalBuyPrice: { $sum: "$purchase.buyPrice" },
        totalSellPrice: { $sum: "$sale.sellPrice" },
        totalServiceCost: { $sum: "$service.totalCost" },
        totalRcCharge: { $sum: "$rc.charge" },
        totalDue: { $sum: "$sale.cash.amountDue" },
      },
    },
  ]);

  // Monthly sales for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthly = await Bike.aggregate([
    {
      $match: {
        ...matchStage,
        status: "sold",
        "sale.sellDate": { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$sale.sellDate" },
          month: { $month: "$sale.sellDate" },
        },
        count: { $sum: 1 },
        revenue: { $sum: "$sale.sellPrice" },
        profit: {
          $sum: {
            $subtract: [
              "$sale.sellPrice",
              { $add: ["$purchase.buyPrice", "$service.totalCost", "$rc.charge"] },
            ],
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  res.json({ success: true, data: { statusBreakdown: stats, monthly } });
};