import { prismaClient } from "../apps/database.js";
import {
  createColorValidation,
  getColorValidation,
  searchColorValidation,
  updateColorValidation,
} from "../validations/color.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createColorValidation, req);
  createRequest.created_by = user.user_id;

  const countColor = await prismaClient.color.count({
    where: {
      color_name: createRequest.color_name,
    },
  });

  if (countColor > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  return await prismaClient.color.create({
    data: createRequest,
    select: {
      color_name: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  const searchRequest = validate(searchColorValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      color_name: { contains: searchRequest.search },
    };
  }

  const data = await prismaClient.color.findMany({
    where,
    take: searchRequest.size,
    skip: skip,
  });
  const total = await prismaClient.color.count({ where });

  return { data, total };
};

const get = async (colorId) => {
  colorId = validate(getColorValidation, colorId);

  const result = await prismaClient.color.findUnique({
    where: {
      color_id: colorId,
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.RECORD_NOT_FOUND);
  }

  return result;
};

const update = async (req) => {
  const updateRequest = validate(updateColorValidation, req);
  const { color_id, ...newRequest } = updateRequest;

  return await prismaClient.color.update({
    where: {
      color_id,
    },
    data: newRequest,
  });
};

export default { create, search, get, update };
