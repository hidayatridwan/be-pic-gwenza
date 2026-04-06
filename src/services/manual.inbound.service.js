import { prismaClient } from "../apps/database.js";
import { createManualInboundValidation, searchManualInboundValidation, getAdjustmentValueValidation } from "../validations/manual.inbound.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createManualInboundValidation, req);
  createRequest.created_by = user.user_id;

  return await prismaClient.inbound.createMany({
    data: createRequest.map((item) => ({
      ...item,
      created_by: user.user_id,
    })),
  });
};

const search = async (req) => {
  const searchRequest = validate(searchManualInboundValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {
    source_type: searchRequest.source_type
  };
  if (searchRequest.search) {
    where = {
      ...where,
      OR: [
        {
          Product: {
            product_name: { contains: searchRequest.search },
          },
        },
        {
          Variant: {
            variant_name: { contains: searchRequest.search },
          },
        },
        {
          CreatedBy: {
            full_name: { contains: searchRequest.search },
          },
        },
        { notes: { contains: searchRequest.search } }
      ],
    };
  }

  const items = await prismaClient.inbound.findMany({
    where,
    select: {
      inbound_id: true,
      inbound_date: true,
      Product: {
        select: {
          product_name: true,
        },
      },
      Variant: {
        select: {
          variant_name: true,
        },
      },
      quantity: true,
      notes: true,
      status: true,
      created_at: true,
      CreatedBy: {
        select: {
          full_name: true,
        },
      },
    },
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      created_at: "desc",
    }
  });

  const data = items.map((item) => {
    return {
      inbound_id: item.inbound_id,
      inbound_date: item.inbound_date,
      product_name: item.Product.product_name,
      variant_name: item.Variant.variant_name,
      quantity: item.quantity,
      notes: item.notes,
      status: item.status,
      created_at: item.created_at,
      created_by: item.CreatedBy.full_name,
    };
  });

  const total = await prismaClient.inbound.count({ where });

  return { data, total };
};

const getAdjustmentValue = async (req) => {
  const request = validate(getAdjustmentValueValidation, req);

  const result = await prismaClient.productVariant.findFirst({
    where: {
      product_id: request.product_id,
      variant_id: request.variant_id,
    },
    include: {
      Product: {
        select: {
          product_name: true,
        },
      },
      Variant: {
        select: {
          variant_name: true,
        }
      }
    }
  });

  const [openOrder, closedOrder, project, inbound, openingStock, returnStock, outbound] = await Promise.all([
    prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	orders
WHERE
  status = 'OPEN'
  AND product_id = ${request.product_id}
  AND variant_id = ${request.variant_id}`,

    prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	orders
WHERE
  status = 'CLOSED'
  AND product_id = ${request.product_id}
  AND variant_id = ${request.variant_id}`,

    prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	projectitems
WHERE
  status != 'CANCEL'
  AND product_id = ${request.product_id}
  AND variant_id = ${request.variant_id}`,

    prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	inbounds
WHERE
	status = 'OK'
AND source_type = 'PROJECT'
AND product_id = ${request.product_id}
AND variant_id = ${request.variant_id}`,

    prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	inbounds
WHERE
	status = 'OK'
AND source_type = 'OPENING_STOCK'
AND product_id = ${request.product_id}
AND variant_id = ${request.variant_id}`,

    prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	inbounds
WHERE
	status = 'OK'
AND source_type = 'RETURN'
AND product_id = ${request.product_id}
AND variant_id = ${request.variant_id}`,

    prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	outbounds
WHERE
	status = 'OK'
AND product_id = ${request.product_id}
AND variant_id = ${request.variant_id}`
  ]);

  const { Product, Variant, ...resultData } = result || {};
  const openOrderQty = Number(openOrder?.[0]?.quantity || 0);
  const closedOrderQty = Number(closedOrder?.[0]?.quantity || 0);
  const projectQty = Number(project?.[0]?.quantity || 0);
  const inboundQty = Number(inbound?.[0]?.quantity || 0);
  const openingStockQty = Number(openingStock?.[0]?.quantity || 0);
  const returnQty = Number(returnStock?.[0]?.quantity || 0);
  const outboundQty = Number(outbound?.[0]?.quantity || 0);
  const wipQty = projectQty - inboundQty;
  const adjustmentQty = inboundQty + wipQty + openingStockQty + returnQty - closedOrderQty - openOrderQty - outboundQty;

  return {
    data: {
      ...resultData,
      product_name: Product?.product_name || null,
      variant_name: Variant?.variant_name || null,
      open_order: openOrderQty,
      closed_order: closedOrderQty,
      project: projectQty,
      inbound: inboundQty,
      wip: wipQty,
      initial_stok: openingStockQty,
      opening_stock: openingStockQty,
      return: returnQty,
      outbound: outboundQty,
      adjustment: adjustmentQty,
    }
  };
};

export default {
  create,
  search,
  getAdjustmentValue,
};
