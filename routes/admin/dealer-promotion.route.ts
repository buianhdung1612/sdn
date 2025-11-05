import { Router } from "express";
import * as dealerPromotionController from "../../controllers/admin/dealer-promotion.controller";
import multer from "multer";
import * as dealerPromotionValidate from "../../validates/admin/dealer-promotion.validate";

const router = Router({ mergeParams: true });
const upload = multer();

router.get('/list', dealerPromotionController.list);
router.get('/create', dealerPromotionController.create);
router.post(
    '/create',
    upload.none(),
    dealerPromotionValidate.createPost,
    dealerPromotionController.createPost
);
router.get('/edit/:id', dealerPromotionController.edit);
router.patch(
    '/edit/:id',
    upload.none(),
    dealerPromotionValidate.editPatch,
    dealerPromotionController.editPatch
);
router.patch('/delete/:id', dealerPromotionController.deletePatch);

export default router;

