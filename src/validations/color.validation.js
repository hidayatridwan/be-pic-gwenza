import Joi from "joi";

const createColorValidation = Joi.object({
  color_name: Joi.string().max(255).required(),
});

const searchColorValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(5000).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const getColorValidation = Joi.number().positive().required();

const updateColorValidation = Joi.object({
  color_id: Joi.number().min(1).positive(),
  color_name: Joi.string().max(255).required(),
});

export {
  createColorValidation,
  searchColorValidation,
  getColorValidation,
  updateColorValidation,
};
