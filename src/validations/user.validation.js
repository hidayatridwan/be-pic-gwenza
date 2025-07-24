import Joi from "joi";

const registerUserValidation = Joi.object({
  username: Joi.string().max(100).required(),
  password: Joi.string()
    .min(6)
    .max(100)
    .pattern(new RegExp('^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=[\\]{};\'"\\\\|,.<>/?]).*$'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one number, and one special character.',
      'string.min': 'Password must be at least 6 characters long.',
    }),
  full_name: Joi.string().max(100).required(),
});

const loginUserValidation = Joi.object({
  username: Joi.string().max(100).required(),
  password: Joi.string().max(100).required(),
});

const searchUserValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export { registerUserValidation, loginUserValidation, searchUserValidation };
