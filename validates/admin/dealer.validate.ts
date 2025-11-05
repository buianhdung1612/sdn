import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const createPost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        name: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập tên đại lý!"
            }),
        code: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập mã đại lý!"
            }),
        address: Joi.string().allow(''),
        phone: Joi.string().allow(''),
        email: Joi.string().email().allow('').messages({
            "string.email": "Email không hợp lệ!"
        }),
        contractNumber: Joi.string().allow(''),
        contractDate: Joi.string().allow(''),
        expiryDate: Joi.string().allow(''),
        contractValue: Joi.string().allow(''),
        contractType: Joi.string().allow(''),
        contractDescription: Joi.string().allow(''),
        creditLimit: Joi.string().allow(''),
        accountId: Joi.string().allow(''),
        status: Joi.string().allow(''),
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

