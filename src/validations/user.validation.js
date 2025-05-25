import Joi from "joi";

const registerUserValidation = Joi.object({
  username: Joi.string().max(100).required(),
  password: Joi.string().max(100).required(),
  full_name: Joi.string().max(100).required(),
});

const loginUserValidation = Joi.object({
  username: Joi.string().max(100).required(),
  password: Joi.string().max(100).required(),
});

const searchUserValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(50).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export { registerUserValidation, loginUserValidation, searchUserValidation };
