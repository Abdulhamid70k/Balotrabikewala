import Bike from "../models/bike.js";

const userFilter = (req) =>
  req.user.role === "admin" ? {} : { createdBy: req.user._id };

// GET ALL
export const getBikes = async (req, res) => {
  try {
    const { page = 1, limit = 15, sortBy = "-createdAt", status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { bikeName: { $regex: search, $options: "i" } },
      { bikeMake: { $regex: search, $options: "i" } },
      { registrationNumber: { $regex: search, $options: "i" } },
    ];

    const total = await Bike.countDocuments(filter);
    const bikes = await Bike.find(filter)
      .sort(sortBy)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: bikes,
      pagination: {           // ✅ yeh add karo
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// CREATE
export const createBike = async (req, res) => {
  try {
    const bike = await Bike.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: bike });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBike = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: "Bike nahi mili",
      });
    }

    res.json({
      success: true,
      data: bike,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const updateBike = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: "Bike nahi mili",
      });
    }

    res.json({
      success: true,
      message: "Bike update ho gayi",
      data: bike,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const statusBreakdown = await Bike.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalBuyPrice:    { $sum: "$purchase.buyPrice" },
          totalSellPrice:   { $sum: "$sale.sellPrice" },
          totalServiceCost: { $sum: "$service.totalCost" },
          totalRcCharge:    { $sum: "$rc.charge" },
          totalDue:         { $sum: "$sale.cash.amountDue" },
        },
      },
    ]);

    const monthly = await Bike.aggregate([
      { $match: { status: "sold", "sale.sellDate": { $ne: null } } },
      {
        $group: {
          _id: {
            year:  { $year:  "$sale.sellDate" },
            month: { $month: "$sale.sellDate" },
          },
          count:   { $sum: 1 },
          revenue: { $sum: "$sale.sellPrice" },
          profit:  {
            $sum: {
              $subtract: [
                "$sale.sellPrice",
                { $add: ["$purchase.buyPrice", "$service.totalCost", "$rc.charge"] }
              ]
            }
          },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown,  // ✅ Dashboard yeh expect karta hai
        monthly,          // ✅ Monthly chart ke liye
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getReport = async (req, res) => {
  try {
    const { type, from, to, year, month } = req.query;

    let filter = {};

    // Date range filter helper
    const dateRange = (field) => {
      const d = {};
      if (from) d.$gte = new Date(from);
      if (to)   d.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
      if (Object.keys(d).length) filter[field] = d;
    };

    switch (type) {

      case "stock":
        filter.status = "in_stock";
        dateRange("purchase.buyDate");
        break;

      case "purchase":
        dateRange("purchase.buyDate");
        break;

      case "sale":
        filter.status = "sold";
        dateRange("sale.sellDate");
        break;

      case "due":
        filter.status = "sold";
        filter["sale.cash.amountDue"] = { $gt: 0 };
        break;

      case "pending":
        filter.status = "pending_arrival";
        break;

      case "monthly": {
        filter.status = "sold";
        const y = parseInt(year) || new Date().getFullYear();
        const startMonth = month ? parseInt(month) - 1 : 0;
        const endMonth   = month ? parseInt(month)     : 12;
        filter["sale.sellDate"] = {
          $gte: new Date(y, startMonth, 1),
          $lte: new Date(y, endMonth,   0, 23, 59, 59),
        };
        break;
      }

      case "yearly": {
        filter.status = "sold";
        const y = parseInt(year) || new Date().getFullYear();
        filter["sale.sellDate"] = {
          $gte: new Date(y,  0, 1),
          $lte: new Date(y, 11, 31, 23, 59, 59),
        };
        break;
      }

      default:
        return res.status(400).json({ success: false, message: "Invalid report type" });
    }

    const data = await Bike.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const deleteBike = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: "Bike nahi mili",
      });
    }

    await bike.deleteOne();

    res.json({
      success: true,
      message: "Bike delete ho gayi",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};