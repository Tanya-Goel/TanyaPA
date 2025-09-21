// routes/logRoutes.js
import express from "express";
import logController from "../controllers/logController.js";

const router = express.Router();

// Log routes - CRUD operations
router.post("/", logController.createLog);           // Create new log
router.get("/", logController.getAllLogs);           // Get all logs with filters
router.get("/today", logController.getLogsToday);    // Get today's logs
router.put("/:id", logController.updateLog);         // Update log
router.delete("/:id", logController.deleteLog);      // Delete log

export default router;
