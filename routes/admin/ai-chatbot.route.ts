import { Router } from "express";
import * as aiChatbotController from "../../controllers/admin/ai-chatbot.controller";
import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router = Router();

// Hiển thị trang chatbot AI (Admin)
router.get("/", authMiddleware.verifyToken, aiChatbotController.view);

// Chatbot AI - Giao tiếp với AI, đọc database và dự báo nhu cầu (Admin)
router.post("/chat", authMiddleware.verifyToken, aiChatbotController.chat);

export default router;

