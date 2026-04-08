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