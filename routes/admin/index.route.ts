import { Router } from "express";
import dashboardRoutes from "./dashboard.route"
import helperRoutes from "./helper.route"
import rolesRoutes from "./role.route"
import accountAdminRoutes from "./account-admin.route"
import accountRoutes from "./account.route"
import productRoutes from "./product.route"
import dealerRoutes from "./dealer.route"
import dealerTargetSalesRoutes from "./dealer-target-sales.route"
import dealerAllocationRoutes from "./dealer-allocation.route"
import dealerAllocationVinRoutes from "./dealer-allocation-vin.route"
import dealerPricingRoutes from "./dealer-pricing.route"
import dealerDiscountRoutes from "./dealer-discount.route"
import dealerPromotionRoutes from "./dealer-promotion.route"
import reportRoutes from "./report.route"
import analyticsRoutes from "./analytics.route"
import aiRoutes from "./ai.route"

import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use('/dashboard', authMiddleware.verifyToken, dashboardRoutes);
router.use('/helper', authMiddleware.verifyToken, helperRoutes);
router.use('/role', authMiddleware.verifyToken, rolesRoutes);
router.use('/account-admin', authMiddleware.verifyToken, accountAdminRoutes);
router.use('/account', accountRoutes);
router.use('/product', authMiddleware.verifyToken, productRoutes);
router.use('/dealer', authMiddleware.verifyToken, dealerRoutes);
router.use('/dealer/:dealerId/target-sales', authMiddleware.verifyToken, dealerTargetSalesRoutes);
router.use('/dealer/:dealerId/pricing', authMiddleware.verifyToken, dealerPricingRoutes);
router.use('/dealer/:dealerId/discount', authMiddleware.verifyToken, dealerDiscountRoutes);
router.use('/dealer/:dealerId/promotion', authMiddleware.verifyToken, dealerPromotionRoutes);
router.use('/dealer/allocation', authMiddleware.verifyToken, dealerAllocationRoutes);
router.use('/dealer/allocation/:allocationId/vins', authMiddleware.verifyToken, dealerAllocationVinRoutes);
router.use('/report', authMiddleware.verifyToken, reportRoutes);
router.use('/analytics', authMiddleware.verifyToken, analyticsRoutes);
router.use('/ai', authMiddleware.verifyToken, aiRoutes);

export default router;