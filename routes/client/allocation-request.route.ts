import { Router } from "express";
import * as controller from "../../controllers/client/allocation-request.controller";

const router: Router = Router();

// GET /api/client/allocation-requests - Lấy danh sách yêu cầu đặt hàng
router.get("/", controller.getRequestList);

// POST /api/client/allocation-requests - Tạo yêu cầu đặt hàng mới
router.post("/", controller.createRequest);

// PATCH /api/client/allocation-requests/:id/submit - Gửi yêu cầu (phải đặt trước /:id)
router.patch("/:id/submit", controller.submitRequest);

// PATCH /api/client/allocation-requests/:id/cancel - Hủy yêu cầu (phải đặt trước /:id)
router.patch("/:id/cancel", controller.cancelRequest);

// GET /api/client/allocation-requests/:id - Chi tiết yêu cầu
router.get("/:id", controller.getRequestDetail);

// PATCH /api/client/allocation-requests/:id - Cập nhật yêu cầu (chỉ draft)
router.patch("/:id", controller.updateRequest as any);

// DELETE /api/client/allocation-requests/:id - Xóa yêu cầu (chỉ draft)
router.delete("/:id", controller.deleteRequest as any);

export default router;

