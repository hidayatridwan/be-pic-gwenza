import { prismaClient } from "../apps/database.js";
import { searchProductValidation } from "../validations/product.validation.js";
import { validate } from "../validations/validation.js";

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

export default { search };
