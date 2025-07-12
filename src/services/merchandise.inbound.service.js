import { prismaClient } from "../apps/database.js";
import { createMerchandiseInboundValidation, searchMerchandiseInboundValidation } from "../validations/merchandise.inbound.validation.js";
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
        { store_name: { contains: searchRequest.search } },
        { color: { contains: searchRequest.search } },
        {
          Merchandise: {
            product_name: { contains: searchRequest.search },
          },
        },
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
      store_name: true,
      color: true,
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
      store_name: item.store_name,
      color: item.color,
      quantity: item.quantity,
      created_at: item.created_at,
    };
  });

  const total = await prismaClient.merchandiseInbound.count({ where });

  return { data, total };
};

export default {
  create,
  search
};
