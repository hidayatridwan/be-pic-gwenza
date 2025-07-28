import { prismaClient } from "../apps/database.js";
import {
  searchOrderValidation,
} from "../validations/order.validation.js";
import { validate } from "../validations/validation.js";

const search = async (req) => {
  const searchRequest = validate(searchOrderValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        {
          channel: { contains: searchRequest.search },
        },
        {
          order_number: { contains: searchRequest.search },
        },
        {
          product_name: { contains: searchRequest.search },
        },
        {
          variant_name: { contains: searchRequest.search },
        },
      ],
    };
  }

  const result = await prismaClient.order.findMany({
    where,
    select: {
      order_id: true,
      channel: true,
      order_number: true,
      product_id: true,
      product_name: true,
      variant_id: true,
      variant_name: true,
      quantity: true,
      start_date: true,
      end_date: true,
      project_id: true,
      created_at: true,
      User: {
        select: {
          full_name: true,
        },
      },
    },
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      start_date: "desc",
    },
  });

  const data = result.map((item) => ({
    order_id: item.order_id,
    channel: item.channel,
    order_number: item.order_number,
    product_id: item.product_id,
    product_name: item.product_name,
    variant_id: item.variant_id,
    variant_name: item.variant_name,
    quantity: item.quantity,
    start_date: item.start_date,
    end_date: item.end_date,
    project_id: item.project_id,
    created_at: item.created_at,
    created_by: item.User.full_name,
  }));

  const total = await prismaClient.order.count({ where });

  return { data, total };
};

const summary = async (req) => {
  const searchRequest = validate(searchOrderValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};

  if (searchRequest.search) {
    where = {
      OR: [
        { product_name: { contains: searchRequest.search } },
        { variant_name: { contains: searchRequest.search } }
      ],
    };
  }

  // Get both the paginated data and total count in parallel
  const [data, total] = await Promise.all([
    prismaClient.order.groupBy({
      by: ["product_id", "product_name", "variant_id", "variant_name"],
      where,
      _sum: {
        quantity: true,
      },
      take: searchRequest.size,
      skip: skip,
      orderBy: [{ product_name: "asc" }, { variant_name: "asc" }],
    }),
    prismaClient.order.groupBy({
      by: ["product_id", "product_name", "variant_id", "variant_name"],
      where,
      // Just need the count, no need for _sum here
    }).then(groups => groups.length)
  ]);

  return {
    data: data.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      variant_id: item.variant_id,
      variant_name: item.variant_name,
      quantity: item._sum.quantity,
    })),
    total,
  };
};

export default { search, summary };
