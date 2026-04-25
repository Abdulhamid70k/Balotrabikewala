import express from "express";
import Bike from "../models/bike.js";

const router = express.Router();

// GET all in_stock bikes with sale price and images — public, no auth
router.get("/bikes", async (req, res) => {
  try {
    const bikes = await Bike.find(
      { status: "in_stock" },
      {
        bikeName: 1, bikeMake: 1, bikeBrand: 1,
        year: 1, color: 1, registrationNumber: 1,
        status: 1, images: 1,
        "service.items.name": 1,
        "rc.transferred": 1,
        // Show sell price if available (for display purposes)
        "sale.sellPrice": 1,
        createdAt: 1,
      }
    ).sort({ createdAt: -1 }).limit(200);

    res.json({ success: true, data: bikes, count: bikes.length });
  } catch (err) {
    console.error("Public bikes error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// GET bike by registration number
router.get("/bikes/search", async (req, res) => {
  const { reg } = req.query;
  if (!reg) return res.status(400).json({ success: false, message: "Registration number chahiye" });

  try {
    const bike = await Bike.findOne(
      { registrationNumber: reg.trim().toUpperCase() },
      {
        bikeName: 1, bikeMake: 1, bikeBrand: 1,
        year: 1, color: 1, registrationNumber: 1,
        status: 1, images: 1,
        "service.items.name": 1,
        "rc.transferred": 1,
        "sale.sellPrice": 1,
      }
    );

    if (!bike) {
      return res.status(404).json({ success: false, message: "Koi bike nahi mili" });
    }

    res.json({ success: true, data: bike });
  } catch (err) {
    console.error("Public search error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

export default router;