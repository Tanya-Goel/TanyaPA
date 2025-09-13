// routes/logRoutes.js
import express from "express";
import logController from "../controllers/logController.js";

const router = express.Router();

// Log routes
router.post("/", logController.createLog);
router.get("/today", logController.getLogsToday);
router.get("/", logController.getAllLogs);
router.delete("/:id", logController.deleteLog);

export default router;
