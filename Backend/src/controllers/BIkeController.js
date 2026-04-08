import Bike from "../models/bike.js";

const userFilter = (req) =>
  req.user.role === "admin" ? {} : { createdBy: req.user._id };

// GET ALL
export const getBikes = async (req, res) => {
  try {
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 20;
    const skip = (page - 1) * limit;

    const query = { ...userFilter(req) };

    const bikes = await Bike.find(query)
      .skip(skip)
      .limit(limit)
      .sort("-createdAt");

    res.json({ success: true, data: bikes });
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