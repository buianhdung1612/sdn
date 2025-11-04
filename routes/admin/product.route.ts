import { Router } from "express";
import * as productController from "../../controllers/admin/product.controller";
import multer from "multer";
import * as productValidate from "../../validates/admin/product.validate";

const router = Router();

const upload = multer();

router.get('/category', productController.category);

router.get('/category/create', productController.createCategory);

router.post(
    '/category/create',
    upload.none(),
    productValidate.createCategoryPost,
    productController.createCategoryPost
);

router.get('/category/edit/:id', productController.editCategory);

router.patch(
    '/category/edit/:id',
    upload.none(),
    productValidate.createCategoryPost,
    productController.editCategoryPatch
);

router.patch('/category/delete/:id', productController.deleteCategoryPatch);

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