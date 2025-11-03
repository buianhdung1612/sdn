import { Router } from "express";
import * as productController from "../controllers/product.controller";
import multer from "multer";
import * as productValidate from "../validates/product.validate";

const router = Router();

const upload = multer();

router.get('/create', productController.create);
router.post(
    '/create',
    upload.none(),
    productValidate.createPost,
    productController.createPost
);

router.get('/attribute', productController.attribute);

router.get('/attribute/create', productController.createAttribute);

router.post(
    '/attribute/create',
    upload.none(),
    productValidate.createAttributePost,
    productController.createAttributePost
);

router.get('/attribute/edit/:id', productController.editAttribute);

router.patch(
    '/attribute/edit/:id',
    upload.none(),
    productValidate.createAttributePost,
    productController.editAttributePatch
);

router.patch('/attribute/delete/:id', productController.deleteAttributePatch);

export default router;