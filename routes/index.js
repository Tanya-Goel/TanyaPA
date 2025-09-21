// routes/index.js
import express from "express";
import logRoutes from "./logRoutes.js";
import reminderRoutes from "./reminderRoutes.js";
import chatRoutes from "./chatRoutes.js";
import pushRoutes from "./pushRoutes.js";

const router = express.Router();

// Health check route
router.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Personal Assistant API is running!",
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use("/chat", chatRoutes);
router.use("/logs", logRoutes);
router.use("/reminders", reminderRoutes);
router.use("/push", pushRoutes);

export default router;
