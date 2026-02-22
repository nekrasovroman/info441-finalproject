import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    notes: { type: String, default: "" },
    status: { type: String, default: "new" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;