import { Router } from "express";
import * as controller from "../../controllers/client/pricing.controller";

const router = Router();

// GET /api/client/pricing/calculate - Tính giá cuối cùng
router.get("/calculate", controller.calculateFinalPrice);

// GET /api/client/pricing - Lấy giá sỉ
router.get("/", controller.getDealerPricing);

// GET /api/client/discounts - Lấy chiết khấu
router.get("/discounts", controller.getDealerDiscounts);

// ========== PROMOTIONS ==========
// GET /api/client/promotions - Lấy danh sách khuyến mãi
router.get("/promotions", controller.getDealerPromotions);

// POST /api/client/promotions - Tạo khuyến mãi mới
router.post("/promotions", controller.createPromotion as any);

// PATCH /api/client/promotions/:id - Cập nhật khuyến mãi
router.patch("/promotions/:id", controller.updatePromotion as any);

// DELETE /api/client/promotions/:id - Xóa khuyến mãi
router.delete("/promotions/:id", controller.deletePromotion as any);

export default router;

