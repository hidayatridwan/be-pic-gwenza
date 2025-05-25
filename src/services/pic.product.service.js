import { prismaClient } from "../apps/database.js";
import { validate } from "../validations/validation.js";
import { createPicProductValidation } from "../validations/pic.product.validation.js";

const create = async (user, req) => {
  const createRequest = validate(createPicProductValidation, req);

  const picProducts = createRequest.product_id.map((product_id) => ({
    pic_id: createRequest.pic_id,
    product_id,
    created_by: user.user_id,
  }));

  return await prismaClient.picProduct.createMany({
    data: picProducts,
    skipDuplicates: true,
  });
};

export default { create };
