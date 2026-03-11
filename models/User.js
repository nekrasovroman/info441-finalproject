import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["manager", "salesperson"],
      default: "salesperson"
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
