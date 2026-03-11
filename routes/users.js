import express from "express";
import User from "../models/User.js";
import { hashPassword, requireAuth, requireManager } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireManager);

router.get("/", async (req, res) => {
  try {
    const users = await User.find({ accountId: req.user.accountId }).select("-passwordHash");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { email, fullName, password, role } = req.body;
    if (!email || !fullName || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      accountId: req.user.accountId,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role: role === "manager" ? "manager" : "salesperson"
    });

    res.status(201).json({
      id: user._id,
      accountId: user.accountId,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.patch("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["manager", "salesperson"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, accountId: req.user.accountId },
      { role },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user role" });
  }
});

export default router;
