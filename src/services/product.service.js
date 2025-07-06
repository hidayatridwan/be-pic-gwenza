import { prismaClient } from "../apps/database.js";
import {
  createProductValidation,
  getProductValidation,
  searchProductValidation,
  updateProductValidation,
} from "../validations/product.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createProductValidation, req);
  createRequest.created_by = user.user_id;

  const countProduct = await prismaClient.product.count({
    where: {
      product_name: createRequest.product_name,
    },
  });

  if (countProduct > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  return await prismaClient.product.create({
    data: createRequest,
    select: {
      product_name: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  const searchRequest = validate(searchProductValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      product_name: { contains: searchRequest.search },
    };
  }

  const data = await prismaClient.product.findMany({
    where,
    take: searchRequest.size,
    skip: skip,
  });
  const total = await prismaClient.product.count({ where });

  return { data, total };
};

const get = async (productId) => {
  productId = validate(getProductValidation, productId);

  const result = await prismaClient.product.findUnique({
    where: {
      product_id: productId,
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.RECORD_NOT_FOUND);
  }

  return result;
};

const update = async (req) => {
  const updateRequest = validate(updateProductValidation, req);
  const { product_id, ...newRequest } = updateRequest;

  return await prismaClient.product.update({
    where: {
      product_id,
    },
    data: newRequest,
  });
};

export default { create, search, get, update };
