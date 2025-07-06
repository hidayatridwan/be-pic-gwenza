import Joi from "joi";

const createProductValidation = Joi.object({
  product_name: Joi.string().max(100).required(),
});

const searchProductValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const getProductValidation = Joi.number().positive().required();

const updateProductValidation = Joi.object({
  product_id: Joi.number().min(1).positive(),
  product_name: Joi.string().max(100).required(),
});

export {
  createProductValidation,
  searchProductValidation,
  getProductValidation,
  updateProductValidation,
};
