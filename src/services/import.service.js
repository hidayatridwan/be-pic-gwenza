import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../validations/validation.js";
import {
  importValidation,
  searchImportValidation,
} from "../validations/import.validation.js";
import { ImportType, OrderStatus } from "../generated/prisma/index.js";
import { publish } from "../utils/pubsub.js";

const create = async (user, req) => {
  const importRequest = validate(importValidation, req);
  importRequest.created_by = user.user_id;

  try {
    if (importRequest.import_type === ImportType.ORDER) {
      await publish(process.env.UPLOAD_ORDER_QUEUE, importRequest);
      await prismaClient.order.updateMany({
        data: {
          status: OrderStatus.CLOSED
        },
        where: {
          channel: importRequest.channel,
          status: OrderStatus.OPEN
        }
      });
    } else if (ImportType.CANCEL) {
      await publish(process.env.UPLOAD_CANCEL_QUEUE, importRequest);
    } else {
      throw new ResponseError(400, "Invalid import type");
    }
  } catch (err) {
    // Handle error appropriately
    throw new ResponseError(500, `Failed to publish message: ${err.message}`);
    // Potentially implement retry logic here
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
