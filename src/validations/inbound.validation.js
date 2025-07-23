import Joi from "joi";

const createInboundValidation = Joi.array().items(
  Joi.object({
    projectitem_id: Joi.number().required(),
    quantity: Joi.number().required(),
  })
).min(1);

const rejectInboundValidation = Joi.number().positive().required();

const searchInboundValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export {
  createInboundValidation,
  rejectInboundValidation,
  searchInboundValidation,
};
