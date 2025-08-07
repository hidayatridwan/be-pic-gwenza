import Joi from "joi";
import constants from "../utils/constants.js";
import { ImportType } from "../generated/prisma/index.js";

const importValidation = Joi.object({
  channel: Joi.string().valid(constants.TIKTOK, constants.SHOPEE).required(),
  import_type: Joi.string().valid(ImportType.ORDER, ImportType.DELIVERY).required(),
  originalname: Joi.string()
    .pattern(/\.(xlsx|xls)$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid file type. Only Excel files are allowed",
    }),
  mimetype: Joi.string()
    .valid(
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    .required()
    .messages({
      "any.only": "Invalid file MIME type. Only Excel files are allowed",
    }),
}).unknown(true);

const searchImportValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).max(100).positive().default(10),
  search: Joi.string().min(0).max(100).optional(),
});

export { importValidation, searchImportValidation };
