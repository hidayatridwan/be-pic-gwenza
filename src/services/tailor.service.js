import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../validations/validation.js";
import constants from "../utils/constants.js";
import {
  createTailorValidation,
  updateTailorValidation,
  searchTailorValidation,
  getTailorValidation,
  removeTailorValidation,
} from "../validations/tailor.validation.js";

const create = async (user, req) => {
  const createRequest = validate(createTailorValidation, req);
  createRequest.created_by = user.user_id;

  const countTailor = await prismaClient.tailor.count({
    where: {
      tailor_name: createRequest.tailor_name,
    },
  });

  if (countTailor > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  return await prismaClient.tailor.create({
    data: createRequest,
    select: {
      tailor_name: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  const searchRequest = validate(searchTailorValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      tailor_name: { contains: searchRequest.search },
    };
  }

  const data = await prismaClient.tailor.findMany({
    where,
    take: searchRequest.size,
    skip: skip,
  });
  const total = await prismaClient.tailor.count({ where });

  return { data, total };
};

const get = async (tailorId) => {
  tailorId = validate(getTailorValidation, tailorId);

  const result = await prismaClient.tailor.findUnique({
    where: {
      tailor_id: tailorId,
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.RECORD_NOT_FOUND);
  }

  return result;
};

const update = async (req) => {
  const updateRequest = validate(updateTailorValidation, req);
  const { tailor_id, ...newRequest } = updateRequest;

  return await prismaClient.tailor.update({
    where: {
      tailor_id,
    },
    data: newRequest,
  });
};

const remove = async (tailorId) => {
  tailorId = validate(removeTailorValidation, tailorId);

  const countTailor = await prismaClient.tailor.count({
    where: {
      tailor_id: tailorId,
    },
  });

  if (countTailor === 0) {
    throw new ResponseError(404, constants.RECORD_NOT_FOUND);
  }

  const result = await prismaClient.tailor.delete({
    where: {
      tailor_id: tailorId,
    },
  });

  return result;
};

export default { create, search, get, update, remove };
