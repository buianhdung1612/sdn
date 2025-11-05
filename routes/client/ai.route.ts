import { Router } from "express";
import * as aiController from "../../controllers/admin/ai.controller";

const router = Router();

// Public AI forecast endpoint for client (no auth required)
router.post("/forecast-demand", aiController.forecastDemand);

export default router;
