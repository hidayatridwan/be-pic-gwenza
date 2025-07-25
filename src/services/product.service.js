import { prismaClient } from "../apps/database.js";
import {
  createProductValidation,
  getProductValidation,
  searchProductValidation,
  updateProductValidation,
  getVariantValidation
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

  const result = await prismaClient.product.findMany({
    where,
    select: {
      product_id: true,
      fashiondesign_code: true,
      product_name: true,
      cogs: true,
      selling_price: true,
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
    orderBy: {
      product_name: "asc",
    }
  });

  const data = result.map(item => {
    return {
      product_id: item.product_id,
      fashiondesign_code: item.fashiondesign_code,
      product_name: item.product_name,
      cogs: item.cogs,
      selling_price: item.selling_price,
      created_at: item.created_at,
      created_by: item.CreatedBy?.full_name || null,
      updated_at: item.updated_at,
      updated_by: item.UpdatedBy?.full_name || null,
    }
  })

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

const update = async (user, req) => {
  const updateRequest = validate(updateProductValidation, req);
  updateRequest.updated_at = new Date();
  updateRequest.updated_by = user.user_id;
  const { product_id, ...newRequest } = updateRequest;

  return await prismaClient.product.update({
    where: {
      product_id,
    },
    data: newRequest,
  });
};

const getVariants = async (productId) => {
  productId = validate(getVariantValidation, productId);

  const result = await prismaClient.productVariant.findMany({
    where: {
      product_id: productId,
    },
    select: {
      Variant: {
        select: {
          variant_id: true,
          variant_name: true,
        },
      }
    }
  });

  return result.map((item) => ({
    variant_id: item.Variant.variant_id,
    variant_name: item.Variant.variant_name,
  }));
};

export default { create, search, get, update, getVariants };
