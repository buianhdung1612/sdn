import { Router } from "express";
import * as dealerAllocationVinController from "../../controllers/admin/dealer-allocation-vin.controller";
import multer from "multer";
import * as dealerAllocationVinValidate from "../../validates/admin/dealer-allocation-vin.validate";

const router = Router({ mergeParams: true });
const upload = multer();

router.get('/list', dealerAllocationVinController.list);
router.get('/create', dealerAllocationVinController.create);
router.post(
    '/create',
    upload.none(),
    dealerAllocationVinValidate.createPost,
    dealerAllocationVinController.createPost
);
router.get('/edit/:id', dealerAllocationVinController.edit);
router.patch(
    '/edit/:id',
    upload.none(),
    dealerAllocationVinValidate.editPatch,
    dealerAllocationVinController.editPatch
);
// Xóa các route xóa VIN - không cho phép xóa VIN
// router.patch('/delete/:id', dealerAllocationVinController.deletePatch);
// router.patch('/delete-multiple', upload.none(), dealerAllocationVinController.deleteMultiplePatch);

export default router;

