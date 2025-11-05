import { Router } from "express";
import * as dealerDiscountController from "../../controllers/admin/dealer-discount.controller";
import multer from "multer";
import * as dealerDiscountValidate from "../../validates/admin/dealer-discount.validate";

const router = Router({ mergeParams: true });
const upload = multer();

router.get('/list', dealerDiscountController.list);
router.get('/create', dealerDiscountController.create);
router.post(
    '/create',
    upload.none(),
    dealerDiscountValidate.createPost,
    dealerDiscountController.createPost
);
router.get('/edit/:id', dealerDiscountController.edit);
router.patch(
    '/edit/:id',
    upload.none(),
    dealerDiscountValidate.editPatch,
    dealerDiscountController.editPatch
);
router.patch('/delete/:id', dealerDiscountController.deletePatch);

export default router;

