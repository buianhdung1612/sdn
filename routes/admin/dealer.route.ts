import { Router } from "express";
import * as dealerController from "../../controllers/admin/dealer.controller";
import multer from "multer";
import * as dealerValidate from "../../validates/admin/dealer.validate";

const router = Router();

const upload = multer();

router.get('/list', dealerController.list);

router.get('/detail/:id', dealerController.detail);

router.get('/create', dealerController.create);

router.post(
    '/create',
    upload.none(),
    dealerValidate.createPost,
    dealerController.createPost
);

router.get('/edit/:id', dealerController.edit);

router.patch(
    '/edit/:id',
    upload.none(),
    dealerValidate.createPost,
    dealerController.editPatch
);

router.patch('/delete/:id', dealerController.deletePatch);

router.get('/payment/:id', dealerController.payment);

router.post(
    '/payment/:id',
    upload.none(),
    dealerValidate.paymentPost,
    dealerController.paymentPost
);

export default router;

