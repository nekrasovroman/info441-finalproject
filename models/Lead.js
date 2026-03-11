import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: { type: String, required: true },
    address: { type: String, default: "" },
    owner: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: { type: String, default: "New" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
