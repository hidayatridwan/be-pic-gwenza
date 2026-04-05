import Joi from "joi";

const createMerchandiseInboundValidation = Joi.array().items(
  Joi.object({
    inbound_date: Joi.date().required(),
    inbound_code: Joi.string().required(),
    merchandise_id: Joi.number().required(),
    supplier_id: Joi.number().required(),
    color_id: Joi.number().required(),
    price: Joi.number().required(),
    quantity: Joi.number().required(),
    notes: Joi.string().min(0).max(255).optional()
  })
).min(1);

const searchMerchandiseInboundValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
  supplier_id: Joi.number().min(1).positive().optional(),
  color_id: Joi.number().min(1).positive().optional(),
});

const inboundCodesValidation = Joi.number().min(1).positive().required();

const getMerchandiseByInboundCodeValidation = Joi.string().min(1).required();

const cancelMerchandiseInboundValidation = Joi.number().positive().required();

export {
  createMerchandiseInboundValidation,
  searchMerchandiseInboundValidation,
  inboundCodesValidation,
  getMerchandiseByInboundCodeValidation,
  cancelMerchandiseInboundValidation
};
