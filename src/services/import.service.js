import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../validations/validation.js";
import {
  importValidation,
  searchImportValidation,
} from "../validations/import.validation.js";
import { ImportType, OrderStatus } from "../generated/prisma/index.js";
import publisher from "../utils/rabbitmq/publisher.js";

const create = async (user, req) => {
  const importRequest = validate(importValidation, req);
  importRequest.created_by = user.user_id;

  try {
    if (importRequest.import_type === ImportType.ORDER) {

      await prismaClient.order.updateMany({
        data: {
          status: OrderStatus.CLOSED,
          closed_at: new Date(),
        },
        where: {
          channel: importRequest.channel,
          status: OrderStatus.OPEN
        }
      });

      await publisher.publish(process.env.UPLOAD_ORDER_CREATED, {
        event: process.env.UPLOAD_ORDER_CREATED,
        data: importRequest,
        timestamp: new Date().toISOString(),
      });
    } else if (ImportType.CANCEL) {

      await publisher.publish(process.env.UPLOAD_CANCEL_CREATED, {
        event: process.env.UPLOAD_CANCEL_CREATED,
        data: importRequest,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new ResponseError(400, "Invalid import type");
    }
  } catch (err) {
    // Handle error appropriately
    throw new ResponseError(500, `Failed to publish message: ${err.message}`);
  }

  return await prismaClient.import.create({
    data: {
      channel: importRequest.channel,
      import_type: importRequest.import_type,
      file_name: importRequest.key,
      created_by: user.user_id,
    },
    select: {
      channel: true,
      import_type: true,
      file_name: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  const searchRequest = validate(searchImportValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  const whereConditions = [];

  if (searchRequest.search) {
    whereConditions.push({
      OR: [
        { channel: { contains: searchRequest.search } },
        { file_name: { contains: searchRequest.search } },
      ],
    });
  }

  if (searchRequest.channel) {
    whereConditions.push({ channel: searchRequest.channel });
  }

  if (searchRequest.import_type) {
    whereConditions.push({ import_type: searchRequest.import_type });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

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
      channel: item.channel,
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