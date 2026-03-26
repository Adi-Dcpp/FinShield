import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    usualDevices: {
      type: [String],
      default: [],
    },
    homeCountry: {
      type: String,
      default: "IN",
    },
    avgTxnAmount: {
      type: Number,
      default: 0,
    },
    txnCount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
