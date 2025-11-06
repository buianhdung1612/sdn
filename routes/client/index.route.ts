import { Router, Request, Response } from "express";
import accountRoutes from "./account.route"
import productRoutes from "./product.route"
import stationRoutes from "./station.route"
import aiRoutes from "./ai.route"
import inventoryRoutes from "./inventory.route"
import allocationRequestRoutes from "./allocation-request.route"
import allocationRoutes from "./allocation.route"
import pricingRoutes from "./pricing.route"
import orderRoutes from "./order.route"
import * as authMiddleware from "../../middlewares/client/auth.middleware";

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: "Client API is running!",
        version: "1.0.0",
        endpoints: {
            login: "POST /api/client/account/login",
            products: "GET /api/client/products",
            inventory: "GET /api/client/inventory",
            allocationRequests: "GET /api/client/allocation-requests",
            allocations: "GET /api/client/allocations",
            pricing: "GET /api/client/pricing",
            orders: "GET /api/client/orders"
        }
    });
});

router.use('/account', accountRoutes);
router.use('/products', authMiddleware.verifyToken, productRoutes);
router.use('/inventory', authMiddleware.verifyToken, inventoryRoutes);
router.use('/allocation-requests', authMiddleware.verifyToken, allocationRequestRoutes);
router.use('/allocations', authMiddleware.verifyToken, allocationRoutes);
router.use('/pricing', authMiddleware.verifyToken, pricingRoutes);
router.use('/orders', authMiddleware.verifyToken, orderRoutes);
router.use('/station', stationRoutes);
router.use('/ai', aiRoutes);

export default router;