import { Router } from "express";
import * as dealerTargetSalesController from "../../controllers/admin/dealer-target-sales.controller";
import multer from "multer";
import * as dealerTargetSalesValidate from "../../validates/admin/dealer-target-sales.validate";

const router = Router({ mergeParams: true });
const upload = multer();

router.get('/list', dealerTargetSalesController.list);
router.get('/create', dealerTargetSalesController.create);
router.post(
    '/create',
    upload.none(),
    dealerTargetSalesValidate.createPost,
    dealerTargetSalesController.createPost
);
router.get('/edit/:id', dealerTargetSalesController.edit);
router.patch(
    '/edit/:id',
    upload.none(),
    dealerTargetSalesValidate.editPatch,
    dealerTargetSalesController.editPatch
);
router.patch('/delete/:id', dealerTargetSalesController.deletePatch);

export default router;

