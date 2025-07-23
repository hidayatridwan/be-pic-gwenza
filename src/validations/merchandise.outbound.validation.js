import Joi from "joi";

const createMerchandiseOutboundValidation = Joi.array().items(
  Joi.object({
    outbound_date: Joi.date().required(),
    merchandise_id: Joi.number().required(),
    outbound_code: Joi.string().required(),
    tailor_id: Joi.number().required(),
    type: Joi.string().valid('New Product', 'Repeat Product').required(),
    fashiondesign_id: Joi.number().allow(null).default(null),
    product_id: Joi.number().allow(null).default(null),
    quantity: Joi.number().required(),
  })
).min(1);

const searchMerchandiseOutboundValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export {
  createMerchandiseOutboundValidation,
  searchMerchandiseOutboundValidation,
};
