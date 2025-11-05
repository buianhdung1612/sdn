import { Router, Request, Response } from "express";
import accountRoutes from "./account.route"
import productRoutes from "./product.route"
import * as authMiddleware from "../../middlewares/client/auth.middleware";

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: "Client API is running!",
        version: "1.0.0",
        endpoints: {
            login: "POST /api/client/account/login",
            products: "GET /api/client/product",
            productDetail: "GET /api/client/product/:id"
        }
    });
});

router.use('/account', accountRoutes);
router.use('/product', authMiddleware.verifyToken, productRoutes);

export default router;