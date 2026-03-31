import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // ─── Reference ───────────────────────────────────────────────────────────
    bike: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bike",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Transaction Type ─────────────────────────────────────────────────────
    type: {
      type: String,
      enum: ["purchase", "service", "sale", "rc_transfer", "due_received"],
      required: true,
    },

    // ─── Amount ───────────────────────────────────────────────────────────────
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    // ─── Payment Mode ─────────────────────────────────────────────────────────
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "finance", "other"],
      default: "cash",
    },

    // ─── Description ──────────────────────────────────────────────────────────
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    // ─── Date ─────────────────────────────────────────────────────────────────
    transactionDate: {
      type: Date,
      default: Date.now,
    },

    // ─── Reference / Receipt ─────────────────────────────────────────────────
    referenceNumber: {
      type: String,
      trim: true,
    },

    // ─── Due specific ─────────────────────────────────────────────────────────
    dueDetails: {
      originalDue: { type: Number, default: 0 },
      amountReceived: { type: Number, default: 0 },
      remainingDue: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
transactionSchema.index({ bike: 1 });
transactionSchema.index({ user: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ transactionDate: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;