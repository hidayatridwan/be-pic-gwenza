import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../validations/validation.js";
import constants from "../utils/constants.js";
import {
  createVariantValidation,
  getVariantValidation,
  searchVariantValidation,
  updateVariantValidation,
  removeVariantValidation,
} from "../validations/variant.validation.js";

const create = async (req) => {
  const createRequest = validate(createVariantValidation, req);

  const countVariant = await prismaClient.variant.count({
    where: {
      variant_name: createRequest.variant_name,
    },
  });

  if (countVariant > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  return await prismaClient.variant.create({
    data: createRequest,
    select: {
      variant_name: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  const searchRequest = validate(searchVariantValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      variant_name: { contains: searchRequest.search },
    };
  }

  const data = await prismaClient.variant.findMany({
    where,
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      variant_name: "asc",
    },
  });
  const total = await prismaClient.variant.count({ where });

  return { data, total };
};

const get = async (variantId) => {
  variantId = validate(getVariantValidation, variantId);

  const result = await prismaClient.variant.findUnique({
    where: {
      variant_id: variantId,
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.RECORD_NOT_FOUND);
  }

  return result;
};

const update = async (req) => {
  const updateRequest = validate(updateVariantValidation, req);
  const { variant_id, ...newRequest } = updateRequest;

  return await prismaClient.variant.update({
    where: {
      variant_id,
    },
    data: newRequest,
  });
};

const remove = async (variantId) => {
  variantId = validate(removeVariantValidation, variantId);

  const countVariant = await prismaClient.variant.count({
    where: {
      variant_id: variantId,
    },
  });

  if (countVariant === 0) {
    throw new ResponseError(404, constants.RECORD_NOT_FOUND);
  }

  const [inboundCount, projectItemCount, orderCount, outboundCount] =
    await prismaClient.$transaction([
      prismaClient.inbound.count({ where: { variant_id: variantId } }),
      prismaClient.projectItem.count({ where: { variant_id: variantId } }),
      prismaClient.order.count({ where: { variant_id: variantId } }),
      prismaClient.outbound.count({ where: { variant_id: variantId } }),
    ]);

  if (inboundCount + projectItemCount + orderCount + outboundCount > 0) {
    throw new ResponseError(409, constants.RECORD_IN_USE);
  }

  const result = await prismaClient.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({
      where: {
        variant_id: variantId,
      },
    });

    return tx.variant.delete({
      where: {
        variant_id: variantId,
      },
    });
  });

  return result;
};

export default { create, search, get, update, remove };
