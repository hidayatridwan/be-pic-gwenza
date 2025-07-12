import { prismaClient } from "../apps/database.js";
import { createMerchandiseOutboundValidation, searchMerchandiseOutboundValidation } from "../validations/merchandise.outbound.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createMerchandiseOutboundValidation, req);

  const merchandiseOutbounds = createRequest.map((item) => ({
    ...item,
    created_by: user.user_id
  }));

  return prismaClient.merchandiseOutbound.createMany({
    data: merchandiseOutbounds,
  });
};

const search = async (req) => {
  const searchRequest = validate(searchMerchandiseOutboundValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        { outbound_code: { contains: searchRequest.search } },
        {
          Merchandise: {
            product_name: { contains: searchRequest.search },
          },
        },
        {
          FashionDesign: {
            sample_code: { contains: searchRequest.search },
          },
        },
        {
          Tailor: {
            tailor_name: { contains: searchRequest.search },
          },
        },
      ],
    };
  }

  const items = await prismaClient.merchandiseOutbound.findMany({
    where,
    select: {
      merchandise_outbound_id: true,
      outbound_date: true,
      outbound_code: true,
      Merchandise: {
        select: {
          product_name: true,
        },
      },
      FashionDesign: {
        select: {
          sample_code: true,
        },
      },
      Tailor: {
        select: {
          tailor_name: true,
        },
      },
      quantity: true,
      created_at: true,
    },
    take: searchRequest.size,
    skip: skip,
  });

  const data = items.map((item) => {
    return {
      merchandise_outbound_id: item.merchandise_outbound_id,
      outbound_date: item.outbound_date,
      outbound_code: item.outbound_code,
      product_name: item.Merchandise.product_name,
      sample_code: item.FashionDesign.sample_code,
      tailor_name: item.Tailor.tailor_name,
      quantity: item.quantity,
      created_at: item.created_at,
    };
  });

  const total = await prismaClient.merchandiseOutbound.count({ where });

  return { data, total };
};

export default {
  create,
  search
};
