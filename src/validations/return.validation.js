import Joi from "joi";

const createReturnValidation = Joi.array().items(
  Joi.object({
    return_date: Joi.date().required(),
    product_id: Joi.number().required(),
    variant_id: Joi.number().required(),
    quantity: Joi.number().required(),
    notes: Joi.string().min(0).max(255).optional()
  })
).min(1);

const searchReturnValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export {
  createReturnValidation,
  searchReturnValidation
};
