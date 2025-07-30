import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { MerchandiseInboundStatus } from "../generated/prisma/index.js";
import { cancelMerchandiseInboundValidation, createMerchandiseInboundValidation, inboundCodesValidation, searchMerchandiseInboundValidation } from "../validations/merchandise.inbound.validation.js";
import { validate } from "../validations/validation.js";

const create = async (user, req) => {
  const createRequest = validate(createMerchandiseInboundValidation, req);

  const merchandiseInbounds = createRequest.map((item) => ({
    ...item,
    created_by: user.user_id
  }));

  const merchandiseInboundExists = await prismaClient.merchandiseInbound.findMany({
    where: {
      inbound_code: { in: createRequest.map((item) => item.inbound_code) },
      status: {
        not: MerchandiseInboundStatus.CANCEL
      }
    },
  });

  if (merchandiseInboundExists.length > 0) {
    throw new ResponseError(409, "Inbound code already exists.");
  }

  return prismaClient.merchandiseInbound.createMany({
    data: merchandiseInbounds,
  });
};

const search = async (req) => {
  const searchRequest = validate(searchMerchandiseInboundValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        { inbound_code: { contains: searchRequest.search } },
        { notes: { contains: searchRequest.search } },
        {
          Merchandise: {
            product_name: { contains: searchRequest.search },
          },
        },
        {
          Supplier: {
            supplier_name: { contains: searchRequest.search },
          },
        },
        {
          Color: {
            color_name: { contains: searchRequest.search },
          },
        },
      ],
    };
  }

  const items = await prismaClient.merchandiseInbound.findMany({
    where,
    select: {
      merchandise_inbound_id: true,
      inbound_date: true,
      inbound_code: true,
      Merchandise: {
        select: {
          product_name: true,
        },
      },
      Supplier: {
        select: {
          supplier_name: true,
        },
      },
      Color: {
        select: {
          color_name: true,
        },
      },
      price: true,
      quantity: true,
      notes: true,
      status: true,
      created_at: true,
      User: {
        select: {
          full_name: true,
        },
      },
    },
    take: searchRequest.size,
    skip: skip,
  });

  const data = items.map((item) => {
    return {
      merchandise_inbound_id: item.merchandise_inbound_id,
      inbound_date: item.inbound_date,
      inbound_code: item.inbound_code,
      product_name: item.Merchandise.product_name,
      supplier_name: item.Supplier.supplier_name,
      color_name: item.Color.color_name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
      status: item.status,
      created_at: item.created_at,
      created_by: item.User.full_name
    };
  });

  const total = await prismaClient.merchandiseInbound.count({ where });

  return { data, total };
};

const inboundCodes = async (merchandiseIdInput) => {
  const merchandiseId = validate(inboundCodesValidation, merchandiseIdInput);

  const merchandiseInbounds = await prismaClient.merchandiseInbound.findMany({
    where: {
      merchandise_id: merchandiseId,
      status: MerchandiseInboundStatus.OPEN,
    },
    select: {
      inbound_code: true,
      quantity: true
    },
  });

  const inboundCodeList = merchandiseInbounds.map((item) => item.inbound_code);

  const summaryMerchandiseOutbounds = await prismaClient.merchandiseOutbound.groupBy({
    by: ["outbound_code"],
    where: {
      outbound_code: { in: inboundCodeList },
    },
    _sum: {
      quantity: true,
    },
  });

  const outboundQuantityMap = new Map(
    summaryMerchandiseOutbounds.map((item) => [item.outbound_code, item._sum.quantity || 0])
  );

  return merchandiseInbounds.map((item) => ({
    inbound_code: item.inbound_code,
    quantity: item.quantity - (outboundQuantityMap.get(item.inbound_code) || 0),
  }));
};

const cancel = async (merchandiseInboundId) => {
  merchandiseInboundId = validate(cancelMerchandiseInboundValidation, merchandiseInboundId);

  await prismaClient.$transaction(async (tx) => {
    const countMerchandiseInbound = await tx.merchandiseInbound.count({
      where: {
        merchandise_inbound_id: merchandiseInboundId,
      },
    });

    if (countMerchandiseInbound === 0) {
      throw new ResponseError(404, constants.RECORD_NOT_FOUND);
    }

    return await tx.merchandiseInbound.updateMany({
      where: {
        merchandise_inbound_id: merchandiseInboundId,
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
  inboundCodes,
  cancel
};
