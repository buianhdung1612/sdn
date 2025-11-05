import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const createCategoryPost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        name: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập tên danh mục!"
            }),
        slug: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập đường dẫn!"
            }),
        parent: Joi.string().allow(''),
        status: Joi.string().allow(''),
        description: Joi.string().allow(''),
    })

    const { error } = schema.validate(req.body);

    if (error) {
        const errorMessage = error.details[0].message;

        res.json({
            code: "error",
            message: errorMessage
        })
        return;
    }

    next();
}

export const createPost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        name: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập tên sản phẩm!"
            }),
        version: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập phiên bản!"
            }),
        slug: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập đường dẫn!"
            }),
        position: Joi.string().allow(''),
        status: Joi.string().allow(''),
        category: Joi.string().allow(''),
        content: Joi.string().allow(''),
        images: Joi.alternatives().try(
            Joi.array().items(Joi.string()),
            Joi.string().allow('')
        ).optional(),
        basePrice: Joi.string().allow(''),
        rangeKm: Joi.string().allow(''),
        batteryKWh: Joi.string().allow(''),
        maxPowerHP: Joi.string().allow(''),
        attributes: Joi.string().allow(''),
        variants: Joi.string().allow(''),
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
}

export const createAttributePost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        name: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập tên thuộc tính!"
            }),
        type: Joi.string().allow(''),
        options: Joi.string().allow(''),
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
}
