import { Router } from "express";
import * as controller from "../../controllers/client/inventory.controller";

const router = Router();

// GET /api/client/inventory - Lấy danh sách tồn kho
router.get("/", controller.getInventoryList);

// GET /api/client/inventory/:productId - Lấy tồn kho của một sản phẩm
router.get("/:productId", controller.getInventoryByProduct);

export default router;

