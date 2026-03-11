import express from "express";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import { comparePassword, createAuthToken, hashPassword, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { accountName, fullName, email, password } = req.body;
    if (!accountName || !fullName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const organization = await Organization.create({ name: accountName });
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      accountId: organization._id,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role: "manager"
    });

    const token = createAuthToken({
      userId: String(user._id),
      accountId: String(organization._id),
      role: user.role
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        accountId: organization._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to register" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createAuthToken({
      userId: String(user._id),
      accountId: String(user.accountId),
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user._id,
        accountId: user.accountId,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      accountId: user.accountId,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load current user" });
  }
});

export default router;
