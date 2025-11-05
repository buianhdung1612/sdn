import { Router } from "express";
import * as analyticsController from "../../controllers/admin/analytics.controller";

const router = Router();

// JSON endpoints for admin analytics
router.get("/revenue", analyticsController.getRevenue);
router.get("/usage", analyticsController.getUsage);

export default router;
