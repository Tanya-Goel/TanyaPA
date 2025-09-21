// routes/reminderRoutes.js
import express from "express";
import reminderController from "../controllers/reminderController.js";
import reminderMonitor from "../utils/reminderMonitor.js";

const router = express.Router();

// Reminder routes
router.post("/", reminderController.createReminder);
router.get("/today", reminderController.getRemindersToday);
router.get("/", reminderController.getAllReminders);
router.put("/:id", reminderController.updateReminder);
router.put("/:id/dismiss", reminderController.dismissReminder);
router.delete("/:id", reminderController.deleteReminder);

// Manual reminder check endpoint
router.post("/check", async (req, res) => {
  try {
    console.log('🔍 Manual reminder check triggered via API');
    await reminderMonitor.manualCheck();
    res.json({ 
      success: true, 
      message: "Manual reminder check completed",
      status: reminderMonitor.getStatus()
    });
  } catch (error) {
    console.error('❌ Error in manual reminder check:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to check reminders",
      details: error.message 
    });
  }
});

export default router;
