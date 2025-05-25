import { prismaClient } from "../apps/database.js";
import { validate } from "../validations/validation.js";
import {
  createInboundValidation,
  searchInboundValidation,
} from "../validations/inbound.validation.js";

const create = async (user, req) => {
  const createRequest = validate(createInboundValidation, req);
  const data = createRequest.map((item) => ({
    ...item,
    created_by: user.user_id,
  }));

  return await prismaClient.inbound.createMany({ data });
};

const search = async (req) => {
  const searchRequest = validate(searchInboundValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        {
          User: {
            full_name: { contains: searchRequest.search },
          },
        },
        {
          Tailor: {
            tailor_name: { contains: searchRequest.search },
          },
        },
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
      ],
    };
  }

  const items = await prismaClient.inbound.findMany({
    where,
    select: {
      inbound_id: true,
      ProjectItem: {
        select: {
          Project: {
            select: {
              batch_id: true,
            },
          },
          assign_date: true,
        },
      },
      User: {
        select: {
          full_name: true,
        },
      },
      Tailor: {
        select: {
          tailor_name: true,
        },
      },
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
      created_at: true,
    },
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      product_id: "asc",
    },
  });

  // Calculate assignment_age in JavaScript
  const data = items.map((item) => ({
    inbound_id: item.inbound_id,
    batch_id: item.ProjectItem.Project.batch_id,
    pic_name: item.User.full_name,
    tailor_name: item.Tailor.tailor_name,
    product_name: item.Product.product_name,
    variant_name: item.Variant.variant_name,
    assign_date: item.ProjectItem.assign_date,
    quantity: item.quantity,
    created_at: item.created_at,
  }));

  const total = await prismaClient.projectItem.count({ where });

  return { data, total };
};

export default { create, search };
