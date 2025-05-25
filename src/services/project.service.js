import { prismaClient } from "../apps/database.js";
import { validate } from "../validations/validation.js";
import {
  cancelProjectValidation,
  createProjectValidation,
  getItemByProjectIdValidation,
  searchItemValidation,
  searchProjectValidation,
} from "../validations/project.validation.js";
import { generateBatchId } from "../utils/generate.js";

const create = async (user, req) => {
  const createRequest = validate(createProjectValidation, req);

  let result;
  await prismaClient.$transaction(async (tx) => {
    // Create the project
    result = await tx.project.create({
      data: {
        batch_id: generateBatchId(),
        pic_id: user.user_id,
        created_by: user.user_id,
      },
    });

    // Create project items
    const projectItems = createRequest.map((item) => ({
      ...item,
      project_id: result.project_id,
      pic_id: user.user_id,
      created_by: user.user_id,
    }));

    await tx.projectItem.createMany({
      data: projectItems,
    });

    // Build OR conditions for updateMany
    const updateConditions = createRequest.map((item) => ({
      project_id: null,
      product_id: item.product_id,
      variant_id: item.variant_id,
    }));

    // Bulk update orders matching any condition
    await tx.order.updateMany({
      where: {
        OR: updateConditions,
      },
      data: {
        project_id: result.project_id,
      },
    });
  });

  return result;
};

const cancel = async (projectId) => {
  projectId = validate(cancelProjectValidation, projectId);

  const countProject = await prismaClient.project.count({
    where: {
      project_id: projectId,
    },
  });

  if (countProject === 0) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const result = await prismaClient.order.updateMany({
    where: {
      project_id: projectId,
    },
    data: {
      project_id: null,
    },
  });

  return result;
};

const searchProject = async (req) => {
  const searchRequest = validate(searchProjectValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        { batch_id: { contains: searchRequest.search } },
        {
          User: {
            full_name: { contains: searchRequest.search },
          },
        },
      ],
    };
  }

  const items = await prismaClient.project.findMany({
    where,
    select: {
      project_id: true,
      batch_id: true,
      User: {
        select: {
          full_name: true,
        },
      },
      created_at: true,
    },
    take: searchRequest.size,
    skip: skip,
  });

  const data = items.map((item) => {
    return {
      project_id: item.project_id,
      batch_id: item.batch_id,
      pic: item.User.full_name,
      created_at: item.created_at,
    };
  });

  const total = await prismaClient.project.count({ where });

  return { data, total };
};

const searchItem = async (req) => {
  const searchRequest = validate(searchItemValidation, req);
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

  const items = await prismaClient.projectItem.findMany({
    where,
    select: {
      Project: {
        select: {
          batch_id: true,
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
      assign_date: true,
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
    batch_id: item.Project.batch_id,
    pic_name: item.User.full_name,
    tailor_name: item.Tailor.tailor_name,
    product_name: item.Product.product_name,
    variant_name: item.Variant.variant_name,
    assign_date: item.assign_date,
    assign_age: Math.floor(
      (item.assign_date.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    ),
    quantity: item.quantity,
    created_at: item.created_at,
  }));

  const total = await prismaClient.projectItem.count({ where });

  return { data, total };
};

const getItemByProjectId = async (projectId) => {
  projectId = validate(getItemByProjectIdValidation, projectId);

  const items = await prismaClient.projectItem.findMany({
    where: {
      project_id: projectId,
    },
    select: {
      projectitem_id: true,
      Project: {
        select: {
          batch_id: true,
        },
      },
      pic_id: true,
      User: {
        select: {
          full_name: true,
        },
      },
      tailor_id: true,
      Tailor: {
        select: {
          tailor_name: true,
        },
      },
      product_id: true,
      Product: {
        select: {
          product_name: true,
        },
      },
      variant_id: true,
      Variant: {
        select: {
          variant_name: true,
        },
      },
      assign_date: true,
      quantity: true,
      created_at: true,
    },
  });

  return items.map((item) => ({
    projectitem_id: item.projectitem_id,
    batch_id: item.Project.batch_id,
    pic_id: item.pic_id,
    pic_name: item.User.full_name,
    tailor_id: item.tailor_id,
    tailor_name: item.Tailor.tailor_name,
    product_id: item.product_id,
    product_name: item.Product.product_name,
    variant_id: item.variant_id,
    variant_name: item.Variant.variant_name,
    assign_date: item.assign_date,
    quantity: item.quantity,
    created_at: item.created_at,
  }));
};

export default {
  create,
  cancel,
  searchProject,
  searchItem,
  getItemByProjectId,
};
