import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const createPost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        promotionName: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập tên chương trình khuyến mãi!"
            }),
        promotionType: Joi.string()
            .required()
            .valid("buy_x_get_y", "discount_percentage", "fixed_discount", "free_gift")
            .messages({
                "string.empty": "Vui lòng chọn loại khuyến mãi!",
                "any.only": "Loại khuyến mãi không hợp lệ!"
            }),
        promotionValue: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập giá trị khuyến mãi!"
            }),
        applyTo: Joi.string()
            .required()
            .valid("all_products", "specific_products")
            .messages({
                "string.empty": "Vui lòng chọn phạm vi áp dụng!",
                "any.only": "Phạm vi áp dụng không hợp lệ!"
            }),
        productIds: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).allow(''),
        buyX: Joi.string().allow(''),
        getY: Joi.string().allow(''),
        giftProductId: Joi.string().allow(''),
        giftDescription: Joi.string().allow(''),
        minQuantity: Joi.string().allow(''),
        minAmount: Joi.string().allow(''),
        startDate: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn ngày bắt đầu!"
            }),
        endDate: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn ngày kết thúc!"
            }),
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
        promotionName: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập tên chương trình khuyến mãi!"
            }),
        promotionType: Joi.string()
            .required()
            .valid("buy_x_get_y", "discount_percentage", "fixed_discount", "free_gift")
            .messages({
                "string.empty": "Vui lòng chọn loại khuyến mãi!",
                "any.only": "Loại khuyến mãi không hợp lệ!"
            }),
        promotionValue: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập giá trị khuyến mãi!"
            }),
        applyTo: Joi.string()
            .required()
            .valid("all_products", "specific_products")
            .messages({
                "string.empty": "Vui lòng chọn phạm vi áp dụng!",
                "any.only": "Phạm vi áp dụng không hợp lệ!"
            }),
        productIds: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).allow(''),
        buyX: Joi.string().allow(''),
        getY: Joi.string().allow(''),
        giftProductId: Joi.string().allow(''),
        giftDescription: Joi.string().allow(''),
        minQuantity: Joi.string().allow(''),
        minAmount: Joi.string().allow(''),
        startDate: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn ngày bắt đầu!"
            }),
        endDate: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn ngày kết thúc!"
            }),
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

