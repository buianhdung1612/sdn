import { Router } from "express";
import * as stationController from "../../controllers/client/station.controller";
import * as authMiddleware from "../../middlewares/client/auth.middleware";

const router = Router();

// Theo dõi tình trạng trạm sạc và các điểm sạc
router.get(
  "/:stationId/status",
  authMiddleware.verifyToken,
  stationController.getStationStatus
);

// Báo cáo sự cố tại trạm sạc
router.post(
  "/:stationId/incidents",
  authMiddleware.verifyToken,
  stationController.reportIncident
);

export default router;
