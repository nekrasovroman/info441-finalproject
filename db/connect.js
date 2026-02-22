import mongoose from "mongoose";

async function connectDB(uri) {
  if (!uri) throw new Error("Missing MONGODB_URI");

  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");
}

export default connectDB;