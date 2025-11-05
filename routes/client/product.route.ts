import { Router } from "express";
import * as productController from "../../controllers/client/product.controller";

const router = Router();

// API lấy danh sách sản phẩm của đại lý
router.get('/', productController.getProducts);

// API lấy chi tiết sản phẩm
router.get('/:id', productController.getProductDetail);

export default router;

