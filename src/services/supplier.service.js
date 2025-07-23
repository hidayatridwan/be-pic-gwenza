import { prismaClient } from "../apps/database.js";
import {
  createSupplierValidation,
  getSupplierValidation,
  searchSupplierValidation,
  updateSupplierValidation,
} from "../validations/supplier.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createSupplierValidation, req);
  createRequest.created_by = user.user_id;

  const countSupplier = await prismaClient.supplier.count({
    where: {
      supplier_name: createRequest.supplier_name,
    },
  });

  if (countSupplier > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  return await prismaClient.supplier.create({
    data: createRequest,
    select: {
      supplier_name: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  const searchRequest = validate(searchSupplierValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      supplier_name: { contains: searchRequest.search },
    };
  }

  const result = await prismaClient.supplier.findMany({
    where,
    select: {
      supplier_id: true,
      supplier_name: true,
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
      supplier_id: item.supplier_id,
      supplier_name: item.supplier_name,
      created_at: item.created_at,
      created_by: item.CreatedBy.full_name,
      updated_at: item.updated_at,
      updated_by: item.UpdatedBy?.full_name || null,
    };
  });

  const total = await prismaClient.supplier.count({ where });

  return { data, total };
};

const get = async (supplierId) => {
  supplierId = validate(getSupplierValidation, supplierId);

  const result = await prismaClient.supplier.findUnique({
    where: {
      supplier_id: supplierId,
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.RECORD_NOT_FOUND);
  }

  return result;
};

const update = async (user, req) => {
  const updateRequest = validate(updateSupplierValidation, req);
  updateRequest.updated_at = new Date();
  updateRequest.updated_by = user.user_id;
  const { supplier_id, ...newRequest } = updateRequest;

  return await prismaClient.supplier.update({
    where: {
      supplier_id,
    },
    data: newRequest,
  });
};

export default { create, search, get, update };
