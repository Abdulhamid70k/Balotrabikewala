import Item from "../models/item.js";

// GET
export const getItems = async (req, res) => {
  try {
    const q = req.query.q;
    const filter = { isActive: true };

    if (q) filter.$text = { $search: q };

    const items = await Item.find(filter)
      .sort({ name: 1 })
      .limit(100);

    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE
export const createItem = async (req, res) => {
  try {
    const { name, make, brand } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name zaroori hai",
      });
    }

    const exists = await Item.findOne({
      name: name.trim(),
      isActive: true,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Ye item already exist karta hai",
      });
    }

    const item = await Item.create({ name, make, brand });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE
export const updateItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item nahi mila",
      });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item nahi mila",
      });
    }

    res.json({
      success: true,
      message: "Item delete ho gaya",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};