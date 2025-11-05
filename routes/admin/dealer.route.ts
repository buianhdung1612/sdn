import { Router } from "express";
import * as dealerController from "../../controllers/admin/dealer.controller";
import multer from "multer";
import * as dealerValidate from "../../validates/admin/dealer.validate";

const router = Router();

const upload = multer();

router.get('/list', dealerController.list);

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

export default router;

