import Item from "../models/item.js";

export const getItems = async (req, res) => {
  try {
    const items = await Item.find({
      createdBy: req.user._id,
      isActive: true,
    });

    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createItem = async (req, res) => {
  try {
    const item = await Item.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};