import Joi from "joi";

const createTailorValidation = Joi.object({
  tailor_name: Joi.string().max(100).required(),
});

const searchTailorValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(50).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const getTailorValidation = Joi.number().positive().required();

const updateTailorValidation = Joi.object({
  tailor_id: Joi.number().min(1).positive(),
  tailor_name: Joi.string().max(100).required(),
});

const removeTailorValidation = Joi.number().positive().required();

export {
  createTailorValidation,
  searchTailorValidation,
  getTailorValidation,
  updateTailorValidation,
  removeTailorValidation,
};
