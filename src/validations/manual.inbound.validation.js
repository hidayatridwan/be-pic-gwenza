import Joi from "joi";

const createManualInboundValidation = Joi.array().items(
  Joi.object({
    inbound_date: Joi.date().required(),
    source_type: Joi.string().valid("OPENING_STOCK", "ADJUSTMENT", "RETURN").required(),
    product_id: Joi.number().required(),
    variant_id: Joi.number().required(),
    quantity: Joi.number().required(),
    notes: Joi.string().min(0).max(255).optional()
  })
).min(1);

const searchManualInboundValidation = Joi.object({
  source_type: Joi.string().valid("OPENING_STOCK", "ADJUSTMENT", "RETURN").required(),
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const getAdjustmentValueValidation = Joi.object({
  product_id: Joi.number().min(1).positive().required(),
  variant_id: Joi.number().min(1).positive().required(),
});

export {
  createManualInboundValidation,
  searchManualInboundValidation,
  getAdjustmentValueValidation
};
