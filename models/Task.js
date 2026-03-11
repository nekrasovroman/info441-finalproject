import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["visit", "call", "email", "meeting"],
      required: true
    },
    dueDate: { type: Date, required: true },
    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    assignedUser: { type: String, default: "" },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Completed"],
      default: "Open"
    }
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
