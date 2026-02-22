import express from "express";
import Lead from "../models/Lead.js";

const router = express.Router();

// GET all leads
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// CREATE lead
router.post("/", async (req, res) => {
  try {
    const { title, notes, status, latitude, longitude } = req.body;

    const newLead = await Lead.create({
      title,
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