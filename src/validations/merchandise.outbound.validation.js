import Joi from "joi";

const createMerchandiseOutboundValidation = Joi.array().items(
  Joi.object({
    outbound_date: Joi.date().required(),
    outbound_code: Joi.string().required(),
    merchandise_id: Joi.number().required(),
    fashiondesign_id: Joi.number().required(),
    tailor_id: Joi.number().required(),
    quantity: Joi.number().required(),
  })
);

const searchMerchandiseOutboundValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export {
  createMerchandiseOutboundValidation,
  searchMerchandiseOutboundValidation,
};
