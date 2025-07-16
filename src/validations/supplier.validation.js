import Joi from "joi";

const createSupplierValidation = Joi.object({
  supplier_name: Joi.string().max(255).required(),
});

const searchSupplierValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(5000).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

const getSupplierValidation = Joi.number().positive().required();

const updateSupplierValidation = Joi.object({
  supplier_id: Joi.number().min(1).positive(),
  supplier_name: Joi.string().max(255).required(),
});

export {
  createSupplierValidation,
  searchSupplierValidation,
  getSupplierValidation,
  updateSupplierValidation,
};
