import { prismaClient } from "../apps/database.js";
import { searchOrderValidation } from "../validations/order.validation.js";
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

  const data = await prismaClient.order.findMany({
    where,
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      start_date: "desc",
    },
  });
  const total = await prismaClient.order.count({ where });

  return { data, total };
};

const summary = async () => {
  const result = await prismaClient.order.groupBy({
    by: ["product_id", "product_name", "variant_id", "variant_name"],
    where: {
      project_id: null,
    },
    _sum: {
      quantity: true,
    },
    orderBy: [{ product_name: "asc" }, { variant_name: "asc" }],
  });

  return result.map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    variant_id: item.variant_id,
    variant_name: item.variant_name,
    quantity: item._sum.quantity,
  }));
};

export default { search, summary };
