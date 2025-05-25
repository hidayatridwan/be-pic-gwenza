import { prismaClient } from "../apps/database.js";
import { validate } from "../validations/validation.js";
import { searchVariantValidation } from "../validations/variant.validation.js";

const search = async (req) => {
  const searchRequest = validate(searchVariantValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      variant_name: { contains: searchRequest.search },
    };
  }

  const data = await prismaClient.variant.findMany({
    where,
    take: searchRequest.size,
    skip: skip,
  });
  const total = await prismaClient.variant.count({ where });

  return { data, total };
};

export default { search };
