import express from "express";
import mongoose from "mongoose";
import Lead from "../models/Lead.js";
import Contact from "../models/Contact.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { requireAuth, requireManager } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

async function loadBusinessForAccess(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid business ID" });
    }

    const business = await Lead.findOne({ _id: id, accountId: req.user.accountId });
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const isOwner = String(business.ownerUserId) === req.user.userId;
    if (req.user.role !== "manager" && !isOwner) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.business = business;
    next();
  } catch (error) {
    res.status(500).json({ error: "Failed to load business" });
  }
}

router.get("/", async (req, res) => {
  try {
    const query =
      req.user.role === "manager"
        ? { accountId: req.user.accountId }
        : { accountId: req.user.accountId, ownerUserId: req.user.userId };

    const businesses = await Lead.find(query).sort({ createdAt: -1 });
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, address, notes, status, latitude, longitude, ownerUserId } = req.body;

    let assignedOwnerId = req.user.userId;
    let assignedOwnerName = req.user.fullName;

    if (req.user.role === "manager" && ownerUserId) {
      const ownerUser = await User.findOne({ _id: ownerUserId, accountId: req.user.accountId });
      if (!ownerUser) {
        return res.status(400).json({ error: "Invalid owner user" });
      }
      assignedOwnerId = String(ownerUser._id);
      assignedOwnerName = ownerUser.fullName;
    }

    const business = await Lead.create({
      accountId: req.user.accountId,
      ownerUserId: assignedOwnerId,
      title,
      address,
      owner: assignedOwnerName,
      notes,
      status,
      latitude,
      longitude
    });

    res.status(201).json(business);
  } catch (err) {
    res.status(500).json({ error: "Failed to create business" });
  }
});

router.get("/:id", loadBusinessForAccess, async (req, res) => {
  res.json(req.business);
});

router.put("/:id", loadBusinessForAccess, async (req, res) => {
  try {
    const updates = {};
    for (const field of ["title", "address", "notes", "status", "latitude", "longitude"]) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const business = await Lead.findByIdAndUpdate(req.business._id, updates, {
      new: true,
      runValidators: true
    });

    res.json(business);
  } catch (error) {
    res.status(500).json({ error: "Failed to update business" });
  }
});

router.delete("/:id", loadBusinessForAccess, async (req, res) => {
  try {
    await Contact.deleteMany({ businessId: req.business._id, accountId: req.user.accountId });
    await Task.deleteMany({ businessId: req.business._id, accountId: req.user.accountId });
    await Lead.deleteOne({ _id: req.business._id });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete business" });
  }
});

router.patch("/:id/owner", requireManager, async (req, res) => {
  try {
    const { ownerUserId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(ownerUserId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const business = await Lead.findOne({ _id: req.params.id, accountId: req.user.accountId });
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const ownerUser = await User.findOne({ _id: ownerUserId, accountId: req.user.accountId });
    if (!ownerUser) {
      return res.status(400).json({ error: "Invalid owner user" });
    }

    business.ownerUserId = ownerUser._id;
    business.owner = ownerUser.fullName;
    await business.save();

    res.json(business);
  } catch (error) {
    res.status(500).json({ error: "Failed to reassign owner" });
  }
});

router.get("/:id/tasks", loadBusinessForAccess, async (req, res) => {
  try {
    const tasks = await Task.find({
      businessId: req.business._id,
      accountId: req.user.accountId
    }).sort({ dueDate: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.post("/:id/tasks", loadBusinessForAccess, async (req, res) => {
  try {
    const { title, type, dueDate, assignedUserId, description, status } = req.body;

    let assignedUser = null;
    if (assignedUserId) {
      assignedUser = await User.findOne({ _id: assignedUserId, accountId: req.user.accountId });
      if (!assignedUser) {
        return res.status(400).json({ error: "Invalid assigned user" });
      }
    }

    const task = await Task.create({
      accountId: req.user.accountId,
      businessId: req.business._id,
      title,
      type,
      dueDate,
      assignedUserId: assignedUser ? assignedUser._id : req.user.userId,
      assignedUser: assignedUser ? assignedUser.fullName : req.user.fullName,
      description,
      status: status || "Open"
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.patch("/:businessId/tasks/:taskId", async (req, res) => {
  try {
    const { businessId, taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const business = await Lead.findOne({ _id: businessId, accountId: req.user.accountId });
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const task = await Task.findOne({
      _id: taskId,
      businessId,
      accountId: req.user.accountId
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const canUpdate =
      req.user.role === "manager" ||
      String(business.ownerUserId) === req.user.userId ||
      (task.assignedUserId && String(task.assignedUserId) === req.user.userId);

    if (!canUpdate) {
      return res.status(403).json({ error: "Forbidden" });
    }

    for (const field of ["status", "title", "type", "dueDate", "description"]) {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    }

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.get("/:id/contacts", loadBusinessForAccess, async (req, res) => {
  try {
    const contacts = await Contact.find({
      businessId: req.business._id,
      accountId: req.user.accountId
    }).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

router.post("/:id/contacts", loadBusinessForAccess, async (req, res) => {
  try {
    const { name, email, phone, title } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Contact name is required" });
    }

    const contact = await Contact.create({
      accountId: req.user.accountId,
      businessId: req.business._id,
      name,
      email,
      phone,
      title
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: "Failed to create contact" });
  }
});

router.put("/:businessId/contacts/:contactId", async (req, res) => {
  try {
    const { businessId, contactId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const business = await Lead.findOne({ _id: businessId, accountId: req.user.accountId });
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const isOwner = String(business.ownerUserId) === req.user.userId;
    if (req.user.role !== "manager" && !isOwner) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updates = {};
    for (const field of ["name", "email", "phone", "title"]) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: contactId, businessId, accountId: req.user.accountId },
      updates,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: "Failed to update contact" });
  }
});

router.delete("/:businessId/contacts/:contactId", async (req, res) => {
  try {
    const { businessId, contactId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const business = await Lead.findOne({ _id: businessId, accountId: req.user.accountId });
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const isOwner = String(business.ownerUserId) === req.user.userId;
    if (req.user.role !== "manager" && !isOwner) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const deleted = await Contact.findOneAndDelete({
      _id: contactId,
      businessId,
      accountId: req.user.accountId
    });

    if (!deleted) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

export default router;
