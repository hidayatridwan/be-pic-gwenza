import { prismaClient } from "../apps/database.js";
import { createOutboundValidation, searchOutboundValidation } from "../validations/outbound.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createOutboundValidation, req);
  createRequest.created_by = user.user_id;

  return await prismaClient.outbound.createMany({
    data: createRequest.map((item) => ({
      ...item,
      created_by: user.user_id,
    })),
  });
};

const search = async (req) => {
  const searchRequest = validate(searchOutboundValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        {
          Product: {
            product_name: { contains: searchRequest.search },
          },
        },
        {
          Variant: {
            variant_name: { contains: searchRequest.search },
          },
        },
        {
          User: {
            full_name: { contains: searchRequest.search },
          },
        },
        { notes: { contains: searchRequest.search } }
      ],
    };
  }

  const items = await prismaClient.outbound.findMany({
    where,
    select: {
      outbound_id: true,
      outbound_date: true,
      Product: {
        select: {
          product_name: true,
        },
      },
      Variant: {
        select: {
          variant_name: true,
        },
      },
      quantity: true,
      notes: true,
      status: true,
      created_at: true,
      User: {
        select: {
          full_name: true,
        },
      },
    },
    take: searchRequest.size,
    skip: skip,
  });

  const data = items.map((item) => {
    return {
      outbound_id: item.outbound_id,
      outbound_date: item.outbound_date,
      product_name: item.Product.product_name,
      variant_name: item.Variant.variant_name,
      quantity: item.quantity,
      notes: item.notes,
      status: item.status,
      created_at: item.created_at,
      created_by: item.User.full_name,
    };
  });

  const total = await prismaClient.outbound.count({ where });

  return { data, total };
};

export default {
  create,
  search
};
