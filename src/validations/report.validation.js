import Joi from "joi";

const searchByPicValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
  pic_id: Joi.number().min(1).positive().optional(),
});

const searchByTailorValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
  tailor_id: Joi.number().min(1).positive().optional(),
});

const getExpiredProductsValidation = Joi.date().required();

const searchMerchandiseSummaryValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
  category: Joi.string().min(1).max(100).optional(),
  supplier_id: Joi.number().min(1).positive().optional(),
  color_id: Joi.number().min(1).positive().optional(),
});

const searchMerchandiseDateValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
  start_date: Joi.date().optional(),
  end_date: Joi.date().min(Joi.ref('start_date')).optional(),
});

export {
  searchByPicValidation,
  searchByTailorValidation,
  getExpiredProductsValidation,
  searchMerchandiseSummaryValidation,
  searchMerchandiseDateValidation
};
