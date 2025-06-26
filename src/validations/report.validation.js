import Joi from "joi";

const getOrderProductsValidation = Joi.object({
  start_date: Joi.date().required(),
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(50).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const searchByPicValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(50).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const searchByTailorValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(50).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const getExpiredProductsValidation = Joi.date().required();

const searchSummaryValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(50).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export {
  getOrderProductsValidation,
  searchByPicValidation,
  searchByTailorValidation,
  getExpiredProductsValidation,
  searchSummaryValidation,
};
