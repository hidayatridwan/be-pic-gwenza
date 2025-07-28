import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import constants from "../utils/constants.js";
import {
  createMerchandiseValidation,
  getMerchandiseValidation,
  searchMerchandiseValidation,
  updateMerchandiseValidation,
} from "../validations/merchandise.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createMerchandiseValidation, req);
  createRequest.created_by = user.user_id;

  const countMerchandise = await prismaClient.merchandise.count({
    where: {
      product_name: createRequest.product_name,
    },
  });

  if (countMerchandise > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  return await prismaClient.merchandise.create({
    data: createRequest,
    select: {
      category: true,
      product_name: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  const searchRequest = validate(searchMerchandiseValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        {
          product_name: { contains: searchRequest.search },
        },
      ],
    };
  }

  const result = await prismaClient.merchandise.findMany({
    where,
    select: {
      merchandise_id: true,
      category: true,
      product_name: true,
      created_at: true,
      CreatedBy: {
        select: {
          full_name: true,
        },
      },
      updated_at: true,
      UpdatedBy: {
        select: {
          full_name: true,
        },
      },
    },
    take: searchRequest.size,
    skip: skip,
  });

  const data = result.map((item) => {
    return {
      merchandise_id: item.merchandise_id,
      category: item.category,
      product_name: item.product_name,
      created_at: item.created_at,
      created_by: item.CreatedBy.full_name,
      updated_at: item.updated_at,
      updated_by: item.UpdatedBy?.full_name || null,
    };
  });

  const total = await prismaClient.merchandise.count({ where });

  return { data, total };
};

const get = async (merchandiseId) => {
  merchandiseId = validate(getMerchandiseValidation, merchandiseId);

  const result = await prismaClient.merchandise.findUnique({
    where: {
      merchandise_id: merchandiseId,
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.RECORD_NOT_FOUND);
  }

  return result;
};

const update = async (req) => {
  const updateRequest = validate(updateMerchandiseValidation, req);
  const { merchandise_id, ...newRequest } = updateRequest;

  return await prismaClient.merchandise.update({
    where: {
      merchandise_id,
    },
    data: newRequest,
  });
};

export default { create, search, get, update };
