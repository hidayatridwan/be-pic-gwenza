import Joi from "joi";

const createProductValidation = Joi.object({
  fashiondesign_code: Joi.string().max(10).optional().allow(null).default(null),
  product_name: Joi.string().max(255).required(),
  cogs: Joi.number().min(0).allow(null).default(null),
  selling_price: Joi.number().min(0).allow(null).default(null),
});

const searchProductValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(5000).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const getProductValidation = Joi.number().positive().required();

const updateProductValidation = Joi.object({
  product_id: Joi.number().min(1).positive(),
  fashiondesign_code: Joi.string().max(10).optional().allow(null).default(null),
  product_name: Joi.string().max(255).required(),
  cogs: Joi.number().min(0).allow(null).default(null),
  selling_price: Joi.number().min(0).allow(null).default(null),
});

export {
  createProductValidation,
  searchProductValidation,
  getProductValidation,
  updateProductValidation,
};
