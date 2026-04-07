import Item from "../models/item.js";

// GET all items (with search)
export const getItems = async (req, res) => {
  const q = req.query.q;
  const filter = { createdBy: req.user._id, isActive: true };
  if (q) filter.$text = { $search: q };

  const items = await Item.find(filter).sort({ name: 1 }).limit(100);
  res.json({ success: true, data: items });
};

// POST create item
export const createItem = async (req, res) => {
  const { name, make, brand } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Name zaroori hai" });

  // Prevent duplicate
  const exists = await Item.findOne({ name: name.trim(), createdBy: req.user._id, isActive: true });
  if (exists) return res.status(400).json({ success: false, message: "Ye item pehle se exist karta hai" });

  const item = await Item.create({ name, make, brand, createdBy: req.user._id });
  res.status(201).json({ success: true, data: item });
};

// PUT update item
export const updateItem = async (req, res) => {
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!item) return res.status(404).json({ success: false, message: "Item nahi mila" });
  res.json({ success: true, data: item });
};

// DELETE (soft delete)
export const deleteItem = async (req, res) => {
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    { isActive: false },
    { new: true }
  );
  if (!item) return res.status(404).json({ success: false, message: "Item nahi mila" });
  res.json({ success: true, message: "Item delete ho gaya" });
};