import Joi from "joi";

const createProjectValidation = Joi.array().items(
  Joi.object({
    tailor_id: Joi.number().required(),
    assign_date: Joi.date().required(),
    product_id: Joi.number().required(),
    variant_id: Joi.number().required(),
    quantity: Joi.number().required(),
  })
).min(1);

const cancelProjectValidation = Joi.number().positive().required();

const searchProjectValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const projectItemsValidation = Joi.number().positive().required();

const productItemsValidation = Joi.number().positive().required();

export {
  createProjectValidation,
  cancelProjectValidation,
  searchProjectValidation,
  projectItemsValidation,
  productItemsValidation
};
