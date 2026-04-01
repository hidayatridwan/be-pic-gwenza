import { prismaClient } from "../apps/database.js";
import { createManualInboundValidation, searchManualInboundValidation } from "../validations/manual.inbound.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createManualInboundValidation, req);
  createRequest.created_by = user.user_id;

  return await prismaClient.inbound.createMany({
    data: createRequest.map((item) => ({
      ...item,
      created_by: user.user_id,
    })),
  });
};

const search = async (req) => {
  const searchRequest = validate(searchManualInboundValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {
    source_type: searchRequest.source_type
  };
  if (searchRequest.search) {
    where = {
      ...where,
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
          CreatedBy: {
            full_name: { contains: searchRequest.search },
          },
        },
        { notes: { contains: searchRequest.search } }
      ],
    };
  }

  const items = await prismaClient.inbound.findMany({
    where,
    select: {
      inbound_id: true,
      inbound_date: true,
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
      CreatedBy: {
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

  const data = items.map((item) => {
    return {
      inbound_id: item.inbound_id,
      inbound_date: item.inbound_date,
      product_name: item.Product.product_name,
      variant_name: item.Variant.variant_name,
      quantity: item.quantity,
      notes: item.notes,
      status: item.status,
      created_at: item.created_at,
      created_by: item.CreatedBy.full_name,
    };
  });

  const total = await prismaClient.inbound.count({ where });

  return { data, total };
};

export default {
  create,
  search
};
