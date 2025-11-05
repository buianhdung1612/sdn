import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const createPost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        dealerId: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn đại lý!"
            }),
        productId: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn sản phẩm!"
            }),
        variantIndex: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn biến thể!"
            }),
        quantity: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập số lượng!"
            }),
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
        quantity: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập số lượng!"
            }),
        status: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn trạng thái!"
            }),
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

