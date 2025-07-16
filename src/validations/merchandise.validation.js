import Joi from "joi";

const createMerchandiseValidation = Joi.object({
  category: Joi.string().valid('MATERIAL', 'ACCESORIES').required(),
  product_name: Joi.string().max(100).required(),
});

const searchMerchandiseValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(5000).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const getMerchandiseValidation = Joi.number().positive().required();

const updateMerchandiseValidation = Joi.object({
  merchandise_id: Joi.number().positive().required(),
  category: Joi.string().valid('MATERIAL', 'ACCESORIES').required(),
  product_name: Joi.string().max(100).required(),
});

export {
  createMerchandiseValidation,
  searchMerchandiseValidation,
  getMerchandiseValidation,
  updateMerchandiseValidation,
};
