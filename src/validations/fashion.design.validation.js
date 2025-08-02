import Joi from "joi";

const createFashionDesignValidation = Joi.object({
  sample_code: Joi.string().max(10).required(),
  sample_file: Joi.string().min(0).max(255).optional().empty("").default(null),
  tailor_id: Joi.number().integer().optional(),
  send_sample_date: Joi.date().optional().empty("").default(null),
  receive_sample_date: Joi.date().optional().empty("").default(null),
  revision_date: Joi.date().optional().empty("").default(null),
  revision_file: Joi.string().min(0).max(255).optional().empty("").default(null),
  on_production_date: Joi.date().optional().empty("").default(null),
  fix_sample_date: Joi.date().optional().empty("").default(null),
  obstacle: Joi.string().min(0).max(255).optional()
});

const searchFashionDesignValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(5000).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const updateFashionDesignValidation = Joi.object({
  fashiondesign_id: Joi.number().min(1).positive(),
  sample_code: Joi.string().max(10).required(),
  sample_file: Joi.string().min(0).max(255).optional().empty("").default(null),
  tailor_id: Joi.number().integer().optional(),
  send_sample_date: Joi.date().min(0).optional().empty("").default(null),
  receive_sample_date: Joi.date().optional().empty("").default(null),
  revision_date: Joi.date().optional().empty("").default(null),
  revision_file: Joi.string().min(0).max(255).optional().empty("").default(null),
  on_production_date: Joi.date().optional().empty("").default(null),
  fix_sample_date: Joi.date().optional().empty("").default(null),
  obstacle: Joi.string().min(0).max(255).optional()
});

const removeFashionDesignValidation = Joi.number().positive().required();

export {
  createFashionDesignValidation,
  searchFashionDesignValidation,
  updateFashionDesignValidation,
  removeFashionDesignValidation,
};
