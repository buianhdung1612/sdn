import { Router } from "express";
import * as controller from "../../controllers/client/test-drive.controller";

const router: Router = Router();

// POST /api/client/test-drives - Đặt lịch lái thử
router.post("/", controller.createTestDrive);

// GET /api/client/test-drives - Lấy danh sách lịch hẹn
router.get("/", controller.getTestDriveList);

// PATCH /api/client/test-drives/:id/confirm - Xác nhận lịch hẹn (đặt trước các routes động)
router.patch("/:id/confirm", controller.confirmTestDrive as any);

// PATCH /api/client/test-drives/:id/complete - Hoàn thành (đặt trước các routes động)
router.patch("/:id/complete", controller.completeTestDrive as any);

// PATCH /api/client/test-drives/:id/cancel - Hủy lịch (đặt trước các routes động)
router.patch("/:id/cancel", controller.cancelTestDrive as any);

// GET /api/client/test-drives/:id - Chi tiết lịch hẹn
router.get("/:id", controller.getTestDriveDetail);

export default router;

