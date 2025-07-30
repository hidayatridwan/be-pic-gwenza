import Joi from "joi";

const createInboundValidation = Joi.array().items(
  Joi.object({
    projectitem_id: Joi.number().required(),
    inbound_date: Joi.date().required(),
    quantity: Joi.number().required(),
    notes: Joi.string().min(0).max(255).optional()
  })
).min(1);

const cancelInboundValidation = Joi.number().positive().required();

const searchInboundValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export {
  createInboundValidation,
  cancelInboundValidation,
  searchInboundValidation,
};
