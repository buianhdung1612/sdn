import { Router } from "express";
import * as dealerPricingController from "../../controllers/admin/dealer-pricing.controller";
import multer from "multer";
import * as dealerPricingValidate from "../../validates/admin/dealer-pricing.validate";

const router = Router({ mergeParams: true });
const upload = multer();

router.get('/list', dealerPricingController.list);
router.get('/create', dealerPricingController.create);
router.post(
    '/create',
    upload.none(),
    dealerPricingValidate.createPost,
    dealerPricingController.createPost
);
router.get('/edit/:id', dealerPricingController.edit);
router.patch(
    '/edit/:id',
    upload.none(),
    dealerPricingValidate.editPatch,
    dealerPricingController.editPatch
);
router.patch('/delete/:id', dealerPricingController.deletePatch);

export default router;

