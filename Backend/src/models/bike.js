import mongoose from "mongoose";

const serviceItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cost: { type: Number, default: 0 },
});

const bikeSchema = new mongoose.Schema(
  {
    // ─── Item reference (from Items Master) ──────────────────────
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    // Denormalized for display even if item deleted
    bikeName: { type: String, required: [true, "Bike name zaroori hai"], trim: true },
    bikeMake:  { type: String, trim: true, default: "" },
    bikeBrand: { type: String, trim: true, default: "" },

    year:               { type: Number },
    color:              { type: String, trim: true },
    registrationNumber: { type: String, trim: true, uppercase: true },

    // ─── Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending_arrival", "in_stock", "sold"],
      default: "in_stock",
    },

    // ─── Purchase Voucher ─────────────────────────────────────────
    purchase: {
      voucherNumber: { type: String, trim: true },
      buyFrom:       { type: String, trim: true },
      buyDate:       Date,
      buyPrice:      { type: Number, default: 0, min: 0 },
    },

    // ─── Service ─────────────────────────────────────────────────
    service: {
      items:     [serviceItemSchema],
      totalCost: { type: Number, default: 0, min: 0 },
      notes:     String,
    },

    // ─── RC Transfer ─────────────────────────────────────────────
    rc: {
      transferred:  { type: Boolean, default: false },
      charge:       { type: Number, default: 0 },
      transferDate: Date,
    },

    // ─── Sale Voucher ─────────────────────────────────────────────
    sale: {
      voucherNumber: { type: String, trim: true },
      sellPrice:     { type: Number, default: 0, min: 0 },
      sellDate:      Date,
      paymentType:   { type: String, enum: ["cash", "finance"], default: "cash" },

      // Customer details
      customer: {
        name:    { type: String, trim: true },
        mobile:  { type: String, trim: true },
        address: { type: String, trim: true },
      },

      // Cash
      cash: {
        amountPaid: { type: Number, default: 0 },
        amountDue:  { type: Number, default: 0 },
        dueDate:    Date,
        dueNote:    { type: String, trim: true }, // when customer will pay
      },

      // Finance
      finance: {
        companyName:   { type: String, trim: true },
        financeAmount: { type: Number, default: 0 },
        emiAmount:     { type: Number, default: 0 },
        emiMonths:     { type: Number, default: 0 },
        startDate:     Date,
      },
    },

    notes: { type: String, maxlength: 500 },

    
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Net profit ──────────────────────────────────────────
bikeSchema.virtual("profit").get(function () {
  if (this.status !== "sold") return null;
  return (
    (this.sale?.sellPrice     || 0) -
    (this.purchase?.buyPrice  || 0) -
    (this.service?.totalCost  || 0) -
    (this.rc?.charge          || 0)
  );
});

bikeSchema.index({ status: 1 });

bikeSchema.index({ "sale.sellDate": -1 });
bikeSchema.index({ bikeName: "text", bikeMake: "text" });

const Bike = mongoose.model("Bike", bikeSchema);
export default Bike;