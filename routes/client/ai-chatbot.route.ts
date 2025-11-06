import { Router } from "express";
import * as aiChatbotController from "../../controllers/client/ai-chatbot.controller";
import * as authMiddleware from "../../middlewares/client/auth.middleware";

const router = Router();

// Chatbot AI - Giao tiếp với AI, đọc database và dự báo nhu cầu
router.post("/chat", authMiddleware.verifyToken, aiChatbotController.chat);

export default router;

