import { Router } from "express";
import * as controller from "../../controllers/client/order.controller";

const router: Router = Router();

// GET /api/client/orders - Lấy danh sách đơn hàng
router.get("/", controller.getOrderList);

// POST /api/client/orders - Tạo đơn hàng mới
router.post("/", controller.createOrder);

// PATCH /api/client/orders/:id/submit - Gửi đơn hàng (draft -> pending)
router.patch("/:id/submit", controller.submitOrder);

// PATCH /api/client/orders/:id/confirm - Xác nhận đơn hàng (pending -> confirmed)
router.patch("/:id/confirm", controller.confirmOrder);

// PATCH /api/client/orders/:id/cancel - Hủy đơn hàng
router.patch("/:id/cancel", controller.cancelOrder);

// GET /api/client/orders/:id/history - Lấy lịch sử đơn hàng
router.get("/:id/history", controller.getOrderHistory);

// GET /api/client/orders/:id - Chi tiết đơn hàng
router.get("/:id", controller.getOrderDetail);

// PATCH /api/client/orders/:id - Cập nhật đơn hàng (chỉ draft)
router.patch("/:id", controller.updateOrder as any);

// DELETE /api/client/orders/:id - Xóa đơn hàng (chỉ draft)
router.delete("/:id", controller.deleteOrder as any);

export default router;

