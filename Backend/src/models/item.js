import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name:  { type: String, required: [true, "Bike name zaroori hai"], trim: true },
    make:  { type: String, trim: true, default: "" },
    brand: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    // Single admin system — String
    createdBy: { type: String, default: "admin" },
  },
  { timestamps: true }
);

itemSchema.index({ name: "text", make: "text", brand: "text" });

const Item = mongoose.model("Item", itemSchema);
export default Item;