import { Router, Request, Response } from "express";
import accountRoutes from "./account.route"
import productRoutes from "./product.route"
import stationRoutes from "./station.route"
import aiRoutes from "./ai.route"
import inventoryRoutes from "./inventory.route"
import allocationRequestRoutes from "./allocation-request.route"
import allocationRoutes from "./allocation.route"
import pricingRoutes from "./pricing.route"
import customerRoutes from "./customer.route"
import testDriveRoutes from "./test-drive.route"
import feedbackRoutes from "./customer-feedback.route"
import * as authMiddleware from "../../middlewares/client/auth.middleware";

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: "Client API is running!",
        version: "1.0.0",
        endpoints: {
            login: "POST /api/client/account/login",
            products: "GET /api/client/product",
            inventory: "GET /api/client/inventory",
            allocationRequests: "GET /api/client/allocation-requests",
            allocations: "GET /api/client/allocations",
            pricing: "GET /api/client/pricing"
        }
    });
});

router.use('/account', accountRoutes);
router.use('/product', authMiddleware.verifyToken, productRoutes);
router.use('/inventory', authMiddleware.verifyToken, inventoryRoutes);
router.use('/allocation-requests', authMiddleware.verifyToken, allocationRequestRoutes);
router.use('/allocations', authMiddleware.verifyToken, allocationRoutes);
router.use('/pricing', authMiddleware.verifyToken, pricingRoutes);
router.use('/customers', authMiddleware.verifyToken, customerRoutes);
router.use('/test-drives', authMiddleware.verifyToken, testDriveRoutes);
router.use('/feedbacks', authMiddleware.verifyToken, feedbackRoutes);
router.use('/station', stationRoutes);
router.use('/ai', aiRoutes);

export default router;