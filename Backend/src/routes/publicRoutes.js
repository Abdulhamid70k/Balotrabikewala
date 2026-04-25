import express from "express";
import Bike from "../models/bike";

const router = express.Router();

// GET all available bikes (no auth, no prices shown)
// Only shows: bikeName, bikeMake, year, color, registrationNumber, status, service items, rc.transferred
router.get("/bikes", async (req, res) => {
  try {
    const bikes = await Bike.find(
      { status: { $in: ["in_stock", "pending_arrival"] } },
      // Only expose safe fields — NO purchase price, NO sale price, NO customer data
      {
        bikeName: 1, bikeMake: 1, bikeBrand: 1,
        year: 1, color: 1, registrationNumber: 1,
        status: 1,
        "service.items.name": 1,   // service items names only (no cost)
        "rc.transferred": 1,
        createdAt: 1,
      }
    ).sort({ createdAt: -1 }).limit(100);

    res.json({ success: true, data: bikes, count: bikes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET single bike by registration number (customer search)
router.get("/bikes/search", async (req, res) => {
  const { reg } = req.query;
  if (!reg) return res.status(400).json({ success: false, message: "Registration number chahiye" });

  try {
    const bike = await Bike.findOne(
      { registrationNumber: reg.trim().toUpperCase() },
      {
        bikeName: 1, bikeMake: 1, bikeBrand: 1,
        year: 1, color: 1, registrationNumber: 1,
        status: 1,
        "service.items.name": 1,
        "rc.transferred": 1,
      }
    );

    if (!bike) {
      return res.status(404).json({ success: false, message: "Koi bike nahi mili" });
    }

    res.json({ success: true, data: bike });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;