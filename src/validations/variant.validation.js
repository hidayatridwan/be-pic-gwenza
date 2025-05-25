import Joi from "joi";

const searchVariantValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(50).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export { searchVariantValidation };
