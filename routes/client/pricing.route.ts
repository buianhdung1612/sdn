import { Router } from "express";
import * as controller from "../../controllers/client/pricing.controller";

const router = Router();

// GET /api/client/pricing/calculate - Tính giá cuối cùng
router.get("/calculate", controller.calculateFinalPrice);

// GET /api/client/pricing - Lấy giá sỉ
router.get("/", controller.getDealerPricing);

// GET /api/client/discounts - Lấy chiết khấu
router.get("/discounts", controller.getDealerDiscounts);

// GET /api/client/promotions - Lấy khuyến mãi
router.get("/promotions", controller.getDealerPromotions);

export default router;

