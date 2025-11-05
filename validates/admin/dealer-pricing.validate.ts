import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const createPost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
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
        wholesalePrice: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập giá sỉ!"
            }),
        effectiveDate: Joi.string()
            .required()
            .custom((value, helpers) => {
                const effectiveDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                effectiveDate.setHours(0, 0, 0, 0);
                
                if (effectiveDate < today) {
                    return helpers.error("date.min", { message: "Ngày hiệu lực không được trong quá khứ!" });
                }
                return value;
            })
            .messages({
                "string.empty": "Vui lòng chọn ngày hiệu lực!",
                "date.min": "Ngày hiệu lực không được trong quá khứ!"
            }),
        expiryDate: Joi.string()
            .allow('')
            .custom((value, helpers) => {
                if (value && value !== '') {
                    const expiryDate = new Date(value);
                    const effectiveDate = new Date(helpers.state.ancestors[0].effectiveDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    expiryDate.setHours(0, 0, 0, 0);
                    effectiveDate.setHours(0, 0, 0, 0);
                    
                    if (expiryDate < today) {
                        return helpers.error("date.min", { message: "Ngày hết hạn không được trong quá khứ!" });
                    }
                    if (expiryDate < effectiveDate) {
                        return helpers.error("date.min", { message: "Ngày hết hạn phải lớn hơn hoặc bằng ngày hiệu lực!" });
                    }
                }
                return value;
            }),
        status: Joi.string().allow(''),
        notes: Joi.string().allow(''),
    }).custom((value, helpers) => {
        // Cross-field validation
        if (value.expiryDate && value.expiryDate !== '' && value.effectiveDate) {
            const expiryDate = new Date(value.expiryDate);
            const effectiveDate = new Date(value.effectiveDate);
            expiryDate.setHours(0, 0, 0, 0);
            effectiveDate.setHours(0, 0, 0, 0);
            
            if (expiryDate < effectiveDate) {
                return helpers.error("date.min", { message: "Ngày hết hạn phải lớn hơn hoặc bằng ngày hiệu lực!" });
            }
        }
        return value;
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
        id: Joi.string().allow(''), // Allow id field from hidden input
        productId: Joi.string().allow(''),
        variantIndex: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn biến thể!"
            }),
        wholesalePrice: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập giá sỉ!"
            }),
        effectiveDate: Joi.string()
            .required()
            .custom((value, helpers) => {
                const effectiveDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                effectiveDate.setHours(0, 0, 0, 0);
                
                if (effectiveDate < today) {
                    return helpers.error("date.min", { message: "Ngày hiệu lực không được trong quá khứ!" });
                }
                return value;
            })
            .messages({
                "string.empty": "Vui lòng chọn ngày hiệu lực!",
                "date.min": "Ngày hiệu lực không được trong quá khứ!"
            }),
        expiryDate: Joi.string()
            .allow('')
            .custom((value, helpers) => {
                if (value && value !== '') {
                    const expiryDate = new Date(value);
                    const effectiveDate = new Date(helpers.state.ancestors[0].effectiveDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    expiryDate.setHours(0, 0, 0, 0);
                    effectiveDate.setHours(0, 0, 0, 0);
                    
                    if (expiryDate < today) {
                        return helpers.error("date.min", { message: "Ngày hết hạn không được trong quá khứ!" });
                    }
                    if (expiryDate < effectiveDate) {
                        return helpers.error("date.min", { message: "Ngày hết hạn phải lớn hơn hoặc bằng ngày hiệu lực!" });
                    }
                }
                return value;
            }),
        status: Joi.string().allow(''),
        notes: Joi.string().allow(''),
    }).custom((value, helpers) => {
        // Cross-field validation
        if (value.expiryDate && value.expiryDate !== '' && value.effectiveDate) {
            const expiryDate = new Date(value.expiryDate);
            const effectiveDate = new Date(value.effectiveDate);
            expiryDate.setHours(0, 0, 0, 0);
            effectiveDate.setHours(0, 0, 0, 0);
            
            if (expiryDate < effectiveDate) {
                return helpers.error("date.min", { message: "Ngày hết hạn phải lớn hơn hoặc bằng ngày hiệu lực!" });
            }
        }
        return value;
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

