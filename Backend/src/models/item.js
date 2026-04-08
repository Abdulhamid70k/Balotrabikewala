import mongoose from "mongoose";

// Items Master — bike names & makes that users pre-define
const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Bike name zaroori hai"],
      trim: true,
    },
    make: {
      type: String,
      trim: true,
      default: "",
    },
    // e.g. Honda, Hero, Bajaj, TVS, Royal Enfield
    brand: {
      type: String,
      trim: true,
      default: "",
    },
   
  },
  { timestamps: true }
);

itemSchema.index({ name: "text", make: "text", brand: "text" });


const Item = mongoose.model("Item", itemSchema);
export default Item;