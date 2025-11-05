import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const createPost = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        year: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng chọn năm!"
            }),
        yearlyTarget: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập chỉ tiêu năm!"
            }),
        quarterlyTargets: Joi.string().allow(''),
        monthlyTargets: Joi.string().allow(''),
        note: Joi.string().allow(''),
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
        yearlyTarget: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập chỉ tiêu năm!"
            }),
        quarterlyTargets: Joi.string().allow(''),
        monthlyTargets: Joi.string().allow(''),
        note: Joi.string().allow(''),
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

