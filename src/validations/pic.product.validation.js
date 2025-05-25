import Joi from "joi";

const createPicProductValidation = Joi.object({
  pic_id: Joi.number().required(),
  product_id: Joi.array().items(Joi.number().positive()).required(),
});

export { createPicProductValidation };
