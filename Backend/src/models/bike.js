import mongoose from "mongoose";

const serviceItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cost: { type: Number, default: 0 },
});

const imageSchema = new mongoose.Schema({
  public_id: String,
  url: String,
});

const bikeSchema = new mongoose.Schema(
  {
    // ─── Basic Info ─────────────────────────────────────────────────────────
    model: {
      type: String,
      required: [true, "Bike model is required"],
      trim: true,
    },
    year: { type: Number },
    color: { type: String, trim: true },
    registrationNumber: { type: String, trim: true, uppercase: true },
    images: [imageSchema],

    // ─── Status ─────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending_arrival", "in_stock", "sold"],
      default: "in_stock",
    },

    // ─── Purchase Details ────────────────────────────────────────────────────
    purchase: {
      buyFrom: { type: String, trim: true },
      buyDate: Date,
      buyPrice: { type: Number, default: 0, min: 0 },
    },

    // ─── Service Details ─────────────────────────────────────────────────────
    service: {
      items: [serviceItemSchema],
      totalCost: { type: Number, default: 0, min: 0 },
      notes: String,
    },

    // ─── RC Transfer ─────────────────────────────────────────────────────────
    rc: {
      transferred: { type: Boolean, default: false },
      charge: { type: Number, default: 0 },
      transferDate: Date,
    },

    // ─── Sale Details ─────────────────────────────────────────────────────────
    sale: {
      sellPrice: { type: Number, default: 0, min: 0 },
      sellDate: Date,
      paymentType: { type: String, enum: ["cash", "finance"], default: "cash" },

      // Cash payment
      cash: {
        amountPaid: { type: Number, default: 0 },
        amountDue: { type: Number, default: 0 },
        dueDate: Date,
      },

      // Finance details
      finance: {
        companyName: String,
        financeAmount: { type: Number, default: 0 },
        emiAmount: { type: Number, default: 0 },
        emiMonths: { type: Number, default: 0 },
        startDate: Date,
      },
    },

    notes: { type: String, maxlength: 500 },

    // ─── Relations ───────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Net profit ─────────────────────────────────────────────────────
bikeSchema.virtual("profit").get(function () {
  if (this.status !== "sold") return null;
  return (
    (this.sale?.sellPrice || 0) -
    (this.purchase?.buyPrice || 0) -
    (this.service?.totalCost || 0) -
    (this.rc?.charge || 0)
  );
});

// ─── Indexes for fast queries ─────────────────────────────────────────────────
bikeSchema.index({ status: 1 });
bikeSchema.index({ createdBy: 1 });
bikeSchema.index({ "sale.sellDate": -1 });
bikeSchema.index({ model: "text" }); // Full-text search

const Bike = mongoose.model("Bike", bikeSchema);
export default Bike;