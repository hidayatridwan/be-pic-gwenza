import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../validations/validation.js";
import constants from "../utils/constants.js";
import {
  importValidation,
  searchImportValidation,
} from "../validations/import.validation.js";
import { publish } from "../utils/rabbitmq.js";

const create = async (user, req) => {
  const importRequest = validate(importValidation, req);
  importRequest.created_by = user.user_id;

  const isPublished = await publish(
    process.env.UPLOAD_ORDER_QUEUE,
    importRequest
  );
  if (!isPublished) {
    throw new ResponseError(500, constants.RABBITMQ_ERROR);
  }

  return await prismaClient.import.create({
    data: {
      file_name: importRequest.key,
      created_by: user.user_id,
    },
    select: {
      file_name: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  const searchRequest = validate(searchImportValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      file_name: { contains: searchRequest.search },
    };
  }

  const data = await prismaClient.import.findMany({
    where,
    take: searchRequest.size,
    skip: skip,
  });
  const total = await prismaClient.import.count({ where });

  return { data, total };
};

export default { create, search };
