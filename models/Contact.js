import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
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
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    title: { type: String, default: "", trim: true }
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
