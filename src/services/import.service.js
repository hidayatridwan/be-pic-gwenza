import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../validations/validation.js";
import constants from "../utils/constants.js";
import {
  importValidation,
  searchImportValidation,
} from "../validations/import.validation.js";
import { publish } from "../utils/rabbitmq.js";
import { ImportType } from "../generated/prisma/index.js";

const create = async (user, req) => {
  const importRequest = validate(importValidation, req);
  importRequest.created_by = user.user_id;

  const isPublished = await publish(
    importRequest.import_type === ImportType.ORDER ? process.env.UPLOAD_ORDER_QUEUE : process.env.UPLOAD_DELIVERY_QUEUE,
    importRequest
  );

  if (!isPublished) {
    throw new ResponseError(500, constants.RABBITMQ_ERROR);
  }

  return await prismaClient.import.create({
    data: {
      import_type: importRequest.import_type,
      file_name: importRequest.key,
      created_by: user.user_id,
    },
    select: {
      import_type: true,
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

  const result = await prismaClient.import.findMany({
    where,
    include: {
      User: {
        select: {
          full_name: true,
        },
      },
    },
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      created_at: "desc",
    }
  });

  const data = result.map((item) => {
    return {
      import_id: item.import_id,
      import_type: item.import_type,
      file_name: item.file_name,
      is_processed: item.is_processed,
      created_at: item.created_at,
      created_by: item.User.full_name,
    };
  });

  const total = await prismaClient.import.count({ where });

  return { data, total };
};

export default { create, search };
