import { Router } from "express";
import * as controller from "../../controllers/client/allocation.controller";

const router = Router();

// GET /api/client/allocations/summary - Thống kê tổng quan
router.get("/summary", controller.getAllocationSummary);

// GET /api/client/allocations - Lấy danh sách phân bổ
router.get("/", controller.getAllocationList);

// GET /api/client/allocations/:id - Chi tiết phân bổ
router.get("/:id", controller.getAllocationDetail);

// GET /api/client/allocations/:id/vins - Danh sách VIN
router.get("/:id/vins", controller.getAllocationVins);

export default router;

