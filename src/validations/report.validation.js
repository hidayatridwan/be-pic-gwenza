import Joi from "joi";

const getExpiredProductsValidation = Joi.date().required();

export { getExpiredProductsValidation };
