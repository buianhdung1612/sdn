import { Router } from "express";
import * as controller from "../../controllers/client/customer-feedback.controller";

const router: Router = Router();

// POST /api/client/feedbacks - Gửi phản hồi/khiếu nại
router.post("/", controller.createFeedback);

// GET /api/client/feedbacks - Lấy danh sách phản hồi
router.get("/", controller.getFeedbackList);

// PATCH /api/client/feedbacks/:id/reply - Trả lời phản hồi (đặt trước các routes động)
router.patch("/:id/reply", controller.replyFeedback as any);

// PATCH /api/client/feedbacks/:id/resolve - Giải quyết phản hồi (đặt trước các routes động)
router.patch("/:id/resolve", controller.resolveFeedback as any);

// PATCH /api/client/feedbacks/:id/close - Đóng phản hồi (đặt trước các routes động)
router.patch("/:id/close", controller.closeFeedback as any);

// GET /api/client/feedbacks/:id - Chi tiết phản hồi
router.get("/:id", controller.getFeedbackDetail);

export default router;

