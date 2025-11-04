import { Router } from "express";
import dashboardRoutes from "./dashboard.route"
import articleRoutes from "./article.route"
import helperRoutes from "./helper.route"
import fileManagerRoutes from "./file-manager.route"
import rolesRoutes from "./role.route"
import accountAdminRoutes from "./account-admin.route"
import accountRoutes from "./account.route"
import productRoutes from "./product.route"

import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use('/dashboard', authMiddleware.verifyToken, dashboardRoutes);
router.use('/article', authMiddleware.verifyToken, articleRoutes);
router.use('/helper', authMiddleware.verifyToken, helperRoutes);
router.use('/role', authMiddleware.verifyToken, rolesRoutes);
router.use('/account-admin', authMiddleware.verifyToken, accountAdminRoutes);
router.use('/file-manager', authMiddleware.verifyToken, fileManagerRoutes);
router.use('/account', accountRoutes);
router.use('/product', authMiddleware.verifyToken, productRoutes);

export default router;