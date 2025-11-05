import { NextFunction, Request, Response } from "express";
import { streamUpload } from "../../helpers/streamUpload.helper";

interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

export const uploadSingle = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const file = (req as any).file as MulterFile | undefined;
        if (file) {
            const result = await streamUpload(file.buffer) as { url: string };
            req.body[file.fieldname] = result.url;
        }
        next();
    } catch (error) {
        console.error("Upload single error:", error);
        res.status(500).json({ code: "error", message: "Upload thất bại!" });
    }
};

export const uploadFields = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const files = (req as any).files as Record<string, MulterFile[]> | undefined;
        if (files) {
            for (const key of Object.keys(files)) {
                const array = files[key];
                if (!Array.isArray(array)) continue;

                req.body[key] = [];

                for (const item of array) {
                    const result = await streamUpload(item.buffer) as { url: string };
                    req.body[key].push(result.url);
                }
            }
        }
        next();
    } catch (error) {
        console.error("Upload fields error:", error);
        res.status(500).json({ code: "error", message: "Upload thất bại!" });
    }
};
