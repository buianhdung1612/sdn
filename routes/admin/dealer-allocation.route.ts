import { Router } from "express";
import * as dealerAllocationController from "../../controllers/admin/dealer-allocation.controller";
import multer from "multer";
import * as dealerAllocationValidate from "../../validates/admin/dealer-allocation.validate";

const router = Router();
const upload = multer();

router.get('/list', dealerAllocationController.list);
router.get('/create', dealerAllocationController.create);
router.get('/detail/:id', dealerAllocationController.detail);
router.post(
    '/create',
    upload.none(),
    dealerAllocationValidate.createPost,
    dealerAllocationController.createPost
);
router.get('/edit/:id', dealerAllocationController.edit);
router.patch(
    '/edit/:id',
    upload.none(),
    dealerAllocationValidate.editPatch,
    dealerAllocationController.editPatch
);
router.patch('/delete/:id', dealerAllocationController.deletePatch);
router.get('/api/product-variants/:productId', dealerAllocationController.getProductVariants);

export default router;

