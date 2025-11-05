import { Router } from "express";
import * as reportController from "../../controllers/admin/report.controller";
import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router = Router();

router.get('/sales-by-dealer', authMiddleware.verifyToken, reportController.salesByDealer);
router.get('/inventory', authMiddleware.verifyToken, reportController.inventoryReport);
router.get('/consumption-rate', authMiddleware.verifyToken, reportController.consumptionRate);

export default router;

