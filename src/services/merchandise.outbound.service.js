import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { MerchandiseInboundStatus } from "../generated/prisma/index.js";
import { cancelMerchandiseOutboundValidation, createMerchandiseOutboundValidation, searchMerchandiseOutboundValidation } from "../validations/merchandise.outbound.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createMerchandiseOutboundValidation, req);

  const inboundCodes = createRequest.map((item) => item.outbound_code);

  return await prismaClient.$transaction(async (tx) => {
    const merchandiseInbounds = await tx.merchandiseInbound.findMany({
      where: {
        inbound_code: { in: inboundCodes },
        status: MerchandiseInboundStatus.OPEN,
      },
    });

    const summaryMerchandiseOutbounds = await tx.merchandiseOutbound.groupBy({
      by: ["outbound_code"],
      where: {
        outbound_code: { in: inboundCodes },
      },
      _sum: {
        quantity: true,
      },
    });

    const updatePromises = [];
    const merchandiseOutbounds = [];

    for (const { type, ...item } of createRequest) {
      const merchandiseInbound = merchandiseInbounds.find(
        (m) => m.inbound_code === item.outbound_code
      );

      if (!merchandiseInbound) {
        throw new ResponseError(400, `Inbound code not found or already closed: ${item.outbound_code}`);
      }

      const summaryMerchandiseOutbound = summaryMerchandiseOutbounds.find(
        (m) => m.outbound_code === item.outbound_code
      );

      if (item.quantity > merchandiseInbound.quantity) {
        throw new ResponseError(400, `Quantity for inbound_code ${item.outbound_code} exceeds available stock (${merchandiseInbound.quantity})`);
      }

      const remainingQty = merchandiseInbound.quantity - (item.quantity + (summaryMerchandiseOutbound?._sum.quantity || 0));
      const newStatus =
        remainingQty <= 0
          ? MerchandiseInboundStatus.CLOSED
          : MerchandiseInboundStatus.OPEN;

      updatePromises.push(
        tx.merchandiseInbound.update({
          where: {
            merchandise_inbound_id: merchandiseInbound.merchandise_inbound_id,
          },
          data: {
            status: newStatus,
          },
        })
      );

      merchandiseOutbounds.push({
        ...item,
        color_id: merchandiseInbound.color_id,
        fashiondesign_id: type === "New Product" ? item.fashiondesign_id : null,
        product_id: type === "Repeat Product" ? item.product_id : null,
        created_by: user.user_id,
      });
    }

    await Promise.all(updatePromises);

    return await tx.merchandiseOutbound.createMany({
      data: merchandiseOutbounds,
    });
  });
};

const search = async (req) => {
  const searchRequest = validate(searchMerchandiseOutboundValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  const search = `%${searchRequest.search ?? ""}%`;

  const items = await prismaClient.$queryRaw`SELECT
  merchandiseoutbounds.merchandise_outbound_id,
	merchandiseoutbounds.outbound_date,
	merchandiseoutbounds.outbound_code,
	merchandises.product_name AS material_name,
  colors.color_name,
	tailors.tailor_name,
	COALESCE(fashiondesigns.sample_code, products.product_name) AS product_name,
	merchandiseoutbounds.quantity,
  merchandiseoutbounds.notes,
  merchandiseoutbounds.status,
  merchandiseoutbounds.created_at,
  users.full_name AS created_by
FROM
	merchandiseoutbounds
	JOIN merchandises ON merchandiseoutbounds.merchandise_id = merchandises.merchandise_id
	JOIN tailors ON merchandiseoutbounds.tailor_id = tailors.tailor_id
	JOIN merchandiseinbounds ON merchandiseoutbounds.outbound_code = merchandiseinbounds.inbound_code
	JOIN colors ON merchandiseinbounds.color_id = colors.color_id
	JOIN users ON merchandiseoutbounds.created_by = users.user_id
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
      notes: item.notes,
      status: item.status,
      created_at: item.created_at,
      created_by: item.created_by
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

const cancel = async (merchandiseOutboundId) => {
  merchandiseOutboundId = validate(cancelMerchandiseOutboundValidation, merchandiseOutboundId);

  await prismaClient.$transaction(async (tx) => {
    const countMerchandiseOutbound = await tx.merchandiseOutbound.count({
      where: {
        merchandise_outbound_id: merchandiseOutboundId,
      },
    });

    if (countMerchandiseOutbound === 0) {
      throw new ResponseError(404, constants.RECORD_NOT_FOUND);
    }

    return await tx.merchandiseOutbound.updateMany({
      where: {
        merchandise_outbound_id: merchandiseOutboundId,
      },
      data: {
        status: MerchandiseInboundStatus.CANCEL,
      },
    });
  });
};

export default {
  create,
  search,
  cancel
};
