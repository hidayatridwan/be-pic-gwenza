import Joi from "joi";

const createMerchandiseInboundValidation = Joi.array().items(
  Joi.object({
    inbound_date: Joi.date().required(),
    inbound_code: Joi.string().required(),
    merchandise_id: Joi.number().required(),
    store_name: Joi.string().required(),
    color: Joi.string().required(),
    quantity: Joi.number().required(),
  })
);

const searchMerchandiseInboundValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export {
  createMerchandiseInboundValidation,
  searchMerchandiseInboundValidation,
};
