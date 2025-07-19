import { prismaClient } from "../apps/database.js";
import { createMerchandiseOutboundValidation, searchMerchandiseOutboundValidation } from "../validations/merchandise.outbound.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createMerchandiseOutboundValidation, req);

  const merchandiseOutbounds = createRequest.map(({ type, ...item }) => ({
    ...item,
    fashiondesign_id: type === "New Product" ? item.fashiondesign_id : null,
    product_id: type === "Repeat Product" ? item.product_id : null,
    created_by: user.user_id
  }));

  return prismaClient.merchandiseOutbound.createMany({
    data: merchandiseOutbounds,
  });
};

const search = async (req) => {
  const searchRequest = validate(searchMerchandiseOutboundValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  const search = `%${searchRequest.search ?? ""}%`;

  const items = await prismaClient.$queryRaw`SELECT
	merchandiseoutbounds.outbound_date,
	merchandiseoutbounds.outbound_code,
	merchandises.product_name AS material_name,
  colors.color_name,
	tailors.tailor_name,
	COALESCE(fashiondesigns.sample_code, products.product_name) AS product_name,
	merchandiseoutbounds.quantity,
  merchandiseoutbounds.created_at
FROM
	merchandiseoutbounds
	JOIN merchandises ON merchandiseoutbounds.merchandise_id = merchandises.merchandise_id
	JOIN tailors ON merchandiseoutbounds.tailor_id = tailors.tailor_id
	JOIN merchandiseinbounds ON merchandiseoutbounds.outbound_code = merchandiseinbounds.inbound_code
	JOIN colors ON merchandiseinbounds.color_id = colors.color_id
	LEFT JOIN fashiondesigns ON merchandiseoutbounds.fashiondesign_id = fashiondesigns.fashiondesign_id
	LEFT JOIN products ON merchandiseoutbounds.product_id = products.product_id
WHERE
  merchandiseoutbounds.outbound_code LIKE ${search} OR
  merchandises.product_name LIKE ${search} OR
  tailors.tailor_name LIKE ${search} OR
  fashiondesigns.sample_code LIKE ${search} OR
  products.product_name LIKE ${search}
ORDER BY merchandiseoutbounds.outbound_date DESC
LIMIT ${searchRequest.size}
OFFSET ${skip}`;

  const data = items.map((item) => {
    return {
      merchandise_outbound_id: item.merchandise_outbound_id,
      outbound_date: item.outbound_date,
      outbound_code: item.outbound_code,
      material_name: item.material_name,
      color_name: item.color_name,
      tailor_name: item.tailor_name,
      product_name: item.product_name,
      quantity: item.quantity,
      created_at: item.created_at,
    };
  });

  const countResult = await prismaClient.$queryRaw`
    SELECT COUNT(*) as total FROM (
      SELECT 1
    FROM
      merchandiseoutbounds
      JOIN merchandises ON merchandiseoutbounds.merchandise_id = merchandises.merchandise_id
      JOIN tailors ON merchandiseoutbounds.tailor_id = tailors.tailor_id
      LEFT JOIN fashiondesigns ON merchandiseoutbounds.fashiondesign_id = fashiondesigns.fashiondesign_id
      LEFT JOIN products ON merchandiseoutbounds.product_id = products.product_id
    WHERE
      merchandiseoutbounds.outbound_code LIKE ${search} OR
      merchandises.product_name LIKE ${search} OR
      tailors.tailor_name LIKE ${search} OR
      fashiondesigns.sample_code LIKE ${search} OR
      products.product_name LIKE ${search}
    ) AS grouped`;

  const total = Number(countResult[0]?.total ?? 0);

  return { data, total };
};

export default {
  create,
  search
};
