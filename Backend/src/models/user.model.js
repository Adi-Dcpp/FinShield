import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // email: {
    //   type: String,
    //   required: true,
    //   unique: true,
    //   lowercase: true,
    //   trim: true,
    // },
    // password: {
    //   type: String,
    //   required: true,
    // },
    isNewUser: {
      type: Boolean,
      default: true,
    },
    usualDevices: {
      type: [String],
      default: [],
    },
    // lastLogin: {
    //   type: Date,
    //   default: Date.now,
    // },
    homeCountry: {
      type: String,
      default: "IN",
    },
    txnCount30d: {
      type: Number,
      default: 0,
    },
    avgTxnAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
