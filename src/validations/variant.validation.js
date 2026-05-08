import Joi from "joi";

const createVariantValidation = Joi.object({
  variant_name: Joi.string().max(100).required(),
});

const searchVariantValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(5000).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const getVariantValidation = Joi.number().positive().required();

const updateVariantValidation = Joi.object({
  variant_id: Joi.number().min(1).positive(),
  variant_name: Joi.string().max(100).required(),
});

const removeVariantValidation = Joi.number().positive().required();

export {
  createVariantValidation,
  searchVariantValidation,
  getVariantValidation,
  updateVariantValidation,
  removeVariantValidation,
};
