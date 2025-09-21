// routes/reminderRoutes.js
import express from "express";
import reminderController from "../controllers/reminderController.js";

const router = express.Router();

// Reminder routes
router.post("/", reminderController.createReminder);
router.get("/today", reminderController.getRemindersToday);
router.get("/", reminderController.getAllReminders);
router.put("/:id", reminderController.updateReminder);
router.put("/:id/dismiss", reminderController.dismissReminder);
router.delete("/:id", reminderController.deleteReminder);

export default router;
