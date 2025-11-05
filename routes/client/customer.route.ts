import { Router } from "express";
import * as controller from "../../controllers/client/customer.controller";

const router: Router = Router();

// POST /api/client/customers/register - Đăng ký khách hàng mới
router.post("/register", controller.register);

// GET /api/client/customers - Lấy danh sách khách hàng
router.get("/", controller.getCustomerList);

// GET /api/client/customers/:id - Chi tiết khách hàng
router.get("/:id", controller.getCustomerDetail);

// PATCH /api/client/customers/:id - Cập nhật khách hàng
router.patch("/:id", controller.updateCustomer as any);

// DELETE /api/client/customers/:id - Xóa khách hàng
router.delete("/:id", controller.deleteCustomer as any);

export default router;

