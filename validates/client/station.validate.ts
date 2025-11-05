import Joi from "joi";

export const reportIncidentSchema = Joi.object({
  type: Joi.string().trim().required(),
  description: Joi.string().trim().min(5).required(),
  severity: Joi.string().valid("low", "medium", "high").default("low"),
  images: Joi.array().items(Joi.string().uri()).default([]),
});
