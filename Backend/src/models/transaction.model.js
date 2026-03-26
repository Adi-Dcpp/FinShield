import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  deviceId: {
    type: String,
    required: true
  },

  geoCountry: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    default: "SUCCESS"
  },

  timestamp: {
    type: Date,
    default: Date.now
  },

  riskPoint: {
    type: Number,
    default: 0
  },

  riskFactors: {
    type: [String],
    default: []
  },

  decision: {
    type: String,
    enum: ["APPROVE", "REVIEW", "BLOCK"],
    default: "APPROVE"
  },

  merchant: {
    type: String,
  }

}, {
  timestamps: true
});

transactionSchema.index({ userId: 1, timestamp: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction; 