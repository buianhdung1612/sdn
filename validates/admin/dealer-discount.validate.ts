import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const createPost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        discountName: Joi.string().allow(''),
        discountType: Joi.string()
            .required()
            .valid("percentage", "fixed_amount")
            .messages({
                "string.empty": "Vui lòng chọn loại chiết khấu!",
                "any.only": "Loại chiết khấu không hợp lệ!"
            }),
        discountValue: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập giá trị chiết khấu!"
            }),
        applyTo: Joi.string()
            .required()
            .valid("all_products", "specific_products", "product_category")
            .messages({
                "string.empty": "Vui lòng chọn phạm vi áp dụng!",
                "any.only": "Phạm vi áp dụng không hợp lệ!"
            }),
        productIds: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).allow(''),
        categoryIds: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).allow(''),
        minQuantity: Joi.string().allow(''),
        minAmount: Joi.string().allow(''),
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
        discountName: Joi.string().allow(''),
        discountType: Joi.string()
            .required()
            .valid("percentage", "fixed_amount")
            .messages({
                "string.empty": "Vui lòng chọn loại chiết khấu!",
                "any.only": "Loại chiết khấu không hợp lệ!"
            }),
        discountValue: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập giá trị chiết khấu!"
            }),
        applyTo: Joi.string()
            .required()
            .valid("all_products", "specific_products", "product_category")
            .messages({
                "string.empty": "Vui lòng chọn phạm vi áp dụng!",
                "any.only": "Phạm vi áp dụng không hợp lệ!"
            }),
        productIds: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).allow(''),
        categoryIds: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).allow(''),
        minQuantity: Joi.string().allow(''),
        minAmount: Joi.string().allow(''),
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

