import { Router } from "express";
import * as aiController from "../../controllers/admin/ai.controller";

const router = Router();

// Forecast charging demand for a station and suggest infrastructure upgrades
router.post("/forecast-demand", aiController.forecastDemand);

export default router;
