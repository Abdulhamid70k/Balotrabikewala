import Item from "../models/item.js";

// GET all items
export const getItems = async (req, res) => {
  try {
    const q = req.query.q;
   const filter = {
  $or: [
    { isActive: true },
    { isActive: { $exists: false } }
  ]
};
    if (q) filter.$text = { $search: q };

    const items = await Item.find(filter).sort({ name: 1 }).limit(200);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create item
export const createItem = async (req, res) => {
  try {
    const { name, make, brand } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name zaroori hai" });

    const exists = await Item.findOne({ name: name.trim(), isActive: true });
    if (exists) return res.status(400).json({ success: false, message: "Ye item pehle se exist karta hai" });
const item = await Item.create({ 
  name, 
  make, 
  brand, 
  isActive: true,
  createdBy: "admin" 
});
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update item
export const updateItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: "Item nahi mila" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE item (soft delete)
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Item nahi mila" });
    res.json({ success: true, message: "Item delete ho gaya" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};