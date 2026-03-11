import express from "express";
import Lead from "../models/Lead.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

// GET all leads
router.get("/", async (req, res) => {
  try {
    const query =
      req.user.role === "manager"
        ? { accountId: req.user.accountId }
        : { accountId: req.user.accountId, ownerUserId: req.user.userId };
    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// CREATE lead
router.post("/", async (req, res) => {
  try {
    const { title, address, owner, notes, status, latitude, longitude } = req.body;

    const newLead = await Lead.create({
      accountId: req.user.accountId,
      ownerUserId: req.user.userId,
      title,
      address,
      owner: owner || req.user.fullName,
      notes,
      status,
      latitude,
      longitude
    });

    res.status(201).json(newLead);
  } catch (err) {
    res.status(500).json({ error: "Failed to create lead" });
  }
});

export default router;
