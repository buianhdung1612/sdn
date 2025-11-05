import { Router } from "express";
import * as accountController from "../../controllers/client/account.controller";
import multer from "multer";
import * as accountValidate from "../../validates/admin/account.validate";

const router = Router();

const upload = multer();

// API đăng nhập cho client (React Native)
router.post(
    '/login',
    upload.none(),
    accountValidate.loginPost,
    accountController.loginPost
);

export default router;