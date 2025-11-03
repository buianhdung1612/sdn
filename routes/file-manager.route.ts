import { Router } from "express";
import * as fileManagerController from "../controllers/file-manager.controller";
import multer from "multer";

const router = Router();

const upload = multer();

router.get('/', fileManagerController.fileManager);

router.post('/upload', upload.array('files'), fileManagerController.uploadPost);

router.patch('/change-file-name/:id', upload.none(), fileManagerController.changeFileNamePatch);

router.delete('/delete-file/:id', fileManagerController.deleteFileDel);

router.post('/folder/create', upload.none(), fileManagerController.createFolderPost);

router.delete('/folder/delete', fileManagerController.deleteFolderDel);

router.get('/iframe', fileManagerController.iframe);

export default router;