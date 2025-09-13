// routes/chatRoutes.js
import express from "express";
import chatController from "../controllers/chatController.js";

const router = express.Router();

// Chat routes
router.post("/", chatController.processMessage);
router.get("/history", chatController.getConversationHistory);

export default router;
