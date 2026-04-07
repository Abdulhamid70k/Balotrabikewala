import Bike from "../models/bike.js";

const userFilter = (req) =>
  req.user.role === "admin" ? {} : { createdBy: req.user._id };

// GET all bikes
export const getBikes = async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 20;
  const skip   = (page - 1) * limit;
  const sortBy = req.query.sortBy || "-createdAt";

  const query = { ...userFilter(req) };
  if (req.query.status) query.status = req.query.status;
  if (req.query.search) query.$text = { $search: req.query.search };

  const [bikes, total] = await Promise.all([
    Bike.find(query).sort(sortBy).skip(skip).limit(limit).populate("createdBy", "name"),
    Bike.countDocuments(query),
  ]);

  res.json({ success: true, data: bikes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// GET single bike
export const getBike = async (req, res) => {
  const bike = await Bike.findById(req.params.id).populate("createdBy", "name email");
  if (!bike) return res.status(404).json({ success: false, message: "Bike nahi mili" });
  if (req.user.role !== "admin" && bike.createdBy._id.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: "Access denied" });
  res.json({ success: true, data: bike });
};

// POST create bike (no image)
export const createBike = async (req, res) => {
  const bike = await Bike.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, message: "Bike add ho gayi", data: bike });
};

// PUT update bike
export const updateBike = async (req, res) => {
  let bike = await Bike.findById(req.params.id);
  if (!bike) return res.status(404).json({ success: false, message: "Bike nahi mili" });
  if (req.user.role !== "admin" && bike.createdBy.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: "Access denied" });

  bike = await Bike.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, message: "Bike update ho gayi", data: bike });
};

// DELETE bike
export const deleteBike = async (req, res) => {
  const bike = await Bike.findById(req.params.id);
  if (!bike) return res.status(404).json({ success: false, message: "Bike nahi mili" });
  await bike.deleteOne();
  res.json({ success: true, message: "Bike delete ho gayi" });
};

// GET dashboard stats
export const getStats = async (req, res) => {
  const match = userFilter(req);
  const userId = req.user.role === "admin" ? null : req.user._id;

  const stats = await Bike.aggregate([
    { $match: match },
    { $group: {
      _id: "$status",
      count:            { $sum: 1 },
      totalBuyPrice:    { $sum: "$purchase.buyPrice" },
      totalSellPrice:   { $sum: "$sale.sellPrice" },
      totalServiceCost: { $sum: "$service.totalCost" },
      totalRcCharge:    { $sum: "$rc.charge" },
      totalDue:         { $sum: "$sale.cash.amountDue" },
    }},
  ]);

  const sixAgo = new Date();
  sixAgo.setMonth(sixAgo.getMonth() - 6);

  const monthly = await Bike.aggregate([
    { $match: { ...match, status: "sold", "sale.sellDate": { $gte: sixAgo } } },
    { $group: {
      _id:     { year: { $year: "$sale.sellDate" }, month: { $month: "$sale.sellDate" } },
      count:   { $sum: 1 },
      revenue: { $sum: "$sale.sellPrice" },
      profit:  { $sum: { $subtract: ["$sale.sellPrice", { $add: ["$purchase.buyPrice", "$service.totalCost", "$rc.charge"] }] } },
    }},
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  res.json({ success: true, data: { statusBreakdown: stats, monthly } });
};

// GET report data — used by all report pages
export const getReport = async (req, res) => {
  const { type, from, to, year, month } = req.query;
  const base = { ...userFilter(req) };

  let query = { ...base };
  let dateField = "createdAt";

  if (type === "purchase")        { dateField = "purchase.buyDate"; }
  else if (type === "sale")       { query.status = "sold"; dateField = "sale.sellDate"; }
  else if (type === "stock")      { query.status = "in_stock"; }
  else if (type === "pending")    { query.status = "pending_arrival"; }
  else if (type === "due")        { query.status = "sold"; query["sale.cash.amountDue"] = { $gt: 0 }; }
  else if (type === "monthly")    {
    query.status = "sold";
    if (year && month) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);
      query["sale.sellDate"] = { $gte: start, $lte: end };
    }
    dateField = "sale.sellDate";
  }
  else if (type === "yearly") {
    query.status = "sold";
    if (year) {
      const start = new Date(year, 0, 1);
      const end   = new Date(year, 11, 31, 23, 59, 59);
      query["sale.sellDate"] = { $gte: start, $lte: end };
    }
    dateField = "sale.sellDate";
  }

  if (from || to) {
    query[dateField] = {};
    if (from) query[dateField].$gte = new Date(from);
    if (to)   query[dateField].$lte = new Date(to + "T23:59:59");
  }

  const bikes = await Bike.find(query).sort({ [dateField]: -1 }).limit(500);
  res.json({ success: true, data: bikes, count: bikes.length });
};