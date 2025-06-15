import { prismaClient } from "../apps/database.js";
import { validate } from "../validations/validation.js";
import {
  createFashionDesignValidation,
  searchFashionDesignValidation,
} from "../validations/fashion.design.validation.js";

const create = async (user, req) => {
  const createRequest = validate(createFashionDesignValidation, req);
  createRequest.created_by = user.user_id;

  return await prismaClient.fashionDesign.create({
    data: createRequest,
    select: {
      sample_code: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  const searchRequest = validate(searchFashionDesignValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        {
          sample_code: { contains: searchRequest.search },
        },
        {
          Tailor: {
            tailor_name: { contains: searchRequest.search },
          },
        },
      ],
    };
  }

  const data = await prismaClient.fashionDesign.findMany({
    where,
    take: searchRequest.size,
    skip: skip,
  });
  const total = await prismaClient.fashionDesign.count({ where });

  return { data, total };
};

export default { create, search };
