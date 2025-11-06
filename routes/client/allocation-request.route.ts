import { Router } from "express";
import * as controller from "../../controllers/client/allocation-request.controller";

const router: Router = Router();

// GET /api/client/allocation-requests - Lấy danh sách yêu cầu đặt hàng
router.get("/", controller.getRequestList);

// POST /api/client/allocation-requests - Tạo và gửi yêu cầu đặt hàng luôn
router.post("/", controller.createRequest);

// PATCH /api/client/allocation-requests/:id/cancel - Hủy yêu cầu (phải đặt trước /:id)
router.patch("/:id/cancel", controller.cancelRequest);

// GET /api/client/allocation-requests/:id - Chi tiết yêu cầu
router.get("/:id", controller.getRequestDetail);

export default router;

