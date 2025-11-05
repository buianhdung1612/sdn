import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const createPost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        productId: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn sản phẩm!"
            }),
        variantIndex: Joi.string().allow(''),
        wholesalePrice: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập giá sỉ!"
            }),
        effectiveDate: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn ngày hiệu lực!"
            }),
        expiryDate: Joi.string().allow(''),
        status: Joi.string().allow(''),
        notes: Joi.string().allow(''),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        const errorMessage = error.details[0].message;
        res.json({
            code: "error",
            message: errorMessage
        });
        return;
    }

    next();
};

export const editPatch = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        productId: Joi.string().allow(''),
        variantIndex: Joi.string().allow(''),
        wholesalePrice: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập giá sỉ!"
            }),
        effectiveDate: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn ngày hiệu lực!"
            }),
        expiryDate: Joi.string().allow(''),
        status: Joi.string().allow(''),
        notes: Joi.string().allow(''),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        const errorMessage = error.details[0].message;
        res.json({
            code: "error",
            message: errorMessage
        });
        return;
    }

    next();
};

