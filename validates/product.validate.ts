import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const createPost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        name: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập tên mẫu xe!"
            }),
        slug: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập đường dẫn!"
            }),
        version: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập phiên bản!"
            }),
        position: Joi.string().allow(''),
        status: Joi.string().allow(''),
        category: Joi.string().allow(''),
        description: Joi.string().allow(''),
        content: Joi.string().allow(''),
        images: Joi.string().allow(''),
        colors: Joi.string().allow(''),
        priceOld: Joi.string().allow(''),
        priceNew: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập giá mới!"
            }),
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
