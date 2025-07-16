import { prismaClient } from "../apps/database.js";
import { createMerchandiseInboundValidation, inboundCodesValidation, searchMerchandiseInboundValidation } from "../validations/merchandise.inbound.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createMerchandiseInboundValidation, req);

  const merchandiseInbounds = createRequest.map((item) => ({
    ...item,
    created_by: user.user_id
  }));

  return prismaClient.merchandiseInbound.createMany({
    data: merchandiseInbounds,
  });
};

const search = async (req) => {
  const searchRequest = validate(searchMerchandiseInboundValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        { inbound_code: { contains: searchRequest.search } },
        {
          Merchandise: {
            product_name: { contains: searchRequest.search },
          },
        },
        {
          Supplier: {
            supplier_name: { contains: searchRequest.search },
          },
        },
        {
          Color: {
            color_name: { contains: searchRequest.search },
          },
        },
        { store_name: { contains: searchRequest.search } },
      ],
    };
  }

  const items = await prismaClient.merchandiseInbound.findMany({
    where,
    select: {
      merchandise_inbound_id: true,
      inbound_date: true,
      inbound_code: true,
      Merchandise: {
        select: {
          product_name: true,
        },
      },
      Supplier: {
        select: {
          supplier_name: true,
        },
      },
      Color: {
        select: {
          color_name: true,
        },
      },
      store_name: true,
      price: true,
      quantity: true,
      created_at: true,
    },
    take: searchRequest.size,
    skip: skip,
  });

  const data = items.map((item) => {
    return {
      merchandise_inbound_id: item.merchandise_inbound_id,
      inbound_date: item.inbound_date,
      inbound_code: item.inbound_code,
      product_name: item.Merchandise.product_name,
      supplier_name: item.Supplier.supplier_name,
      color_name: item.Color.color_name,
      store_name: item.store_name,
      price: item.price,
      quantity: item.quantity,
      created_at: item.created_at,
    };
  });

  const total = await prismaClient.merchandiseInbound.count({ where });

  return { data, total };
};

const inboundCodes = async (merchandiseId) => {
  merchandiseId = validate(inboundCodesValidation, merchandiseId);
  return await prismaClient.merchandiseInbound.findMany({
    where: {
      merchandise_id: merchandiseId,
    },
    select: {
      inbound_code: true,
    },
  });
};

export default {
  create,
  search,
  inboundCodes
};
