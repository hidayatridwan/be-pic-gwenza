import { prismaClient } from "../apps/database.js";
import { validate } from "../validations/validation.js";
import {
  cancelProjectValidation,
  createProjectValidation,
  searchProjectValidation,
  projectItemsValidation,
  productItemsValidation,
  cancelProjectItemValidation,
} from "../validations/project.validation.js";
import { generateBatchId } from "../utils/generate.js";
import { ProjectStatus } from "../generated/prisma/index.js";
import { ResponseError } from "../errors/response.error.js";
import constants from "../utils/constants.js";

const create = async (user, req) => {
  const createRequest = validate(createProjectValidation, req);
  createRequest.created_by = user.user_id;

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

  await prismaClient.$transaction(async (tx) => {
    const countProject = await tx.project.count({
      where: {
        project_id: projectId,
      },
    });

    if (countProject === 0) {
      throw new ResponseError(404, constants.RECORD_NOT_FOUND);
    }

    const countInbound = await tx.inbound.count({
      where: {
        ProjectItem: {
          project_id: projectId,
        }
      },
    });

    if (countInbound > 0) {
      throw new ResponseError(409, 'Inbound already created');
    }

    await tx.order.updateMany({
      where: {
        project_id: projectId,
      },
      data: {
        project_id: null,
      },
    });

    await tx.projectItem.updateMany({
      where: {
        project_id: projectId,
      },
      data: {
        status: ProjectStatus.CANCEL,
      },
    });

    return await tx.project.updateMany({
      where: {
        project_id: projectId,
      },
      data: {
        status: ProjectStatus.CANCEL,
      },
    });
  });
};

const search = async (req) => {
  const searchRequest = validate(searchProjectValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  const whereConditions = [];

  if (searchRequest.search) {
    whereConditions.push({
      OR: [
        { batch_id: { contains: searchRequest.search } },
        {
          User: {
            full_name: { contains: searchRequest.search },
          },
        },
      ],
    });
  }

  if (searchRequest.pic_id) {
    whereConditions.push({ pic_id: searchRequest.pic_id });
  }

  if (searchRequest.status) {
    whereConditions.push({ status: searchRequest.status });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

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
      status: true,
      created_at: true,
    },
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      created_at: "desc",
    }
  });

  const data = items.map((item) => {
    return {
      project_id: item.project_id,
      batch_id: item.batch_id,
      pic_name: item.User.full_name,
      status: item.status,
      created_at: item.created_at,
      created_by: item.User.full_name,
    };
  });

  const total = await prismaClient.project.count({ where });

  return { data, total };
};

const projectItems = async (projectId) => {
  projectId = validate(projectItemsValidation, projectId);

  const result = await prismaClient.$queryRaw`SELECT
	projectitems.projectitem_id,
	projects.batch_id,
	users.full_name AS pic_name,
	tailors.tailor_name,
	products.product_name,
	variants.variant_name,
  projectitems.status,
	projectitems.assign_date,
	DATEDIFF(CURDATE(), projectitems.assign_date) AS assign_age,
	projectitems.quantity,
	sum(inbounds.quantity) AS received,
	projectitems.created_at
FROM
	projectitems
	JOIN projects ON projectitems.project_id = projects.project_id
	JOIN users ON projectitems.pic_id = users.user_id
	JOIN tailors ON projectitems.tailor_id = tailors.tailor_id
	JOIN products ON projectitems.product_id = products.product_id
	JOIN variants ON projectitems.variant_id = variants.variant_id
	LEFT JOIN inbounds ON projectitems.projectitem_id = inbounds.projectitem_id
WHERE
	projectitems.project_id = ${projectId}
GROUP BY
	projectitems.projectitem_id`;

  return result.map((item) => ({
    ...item,
    assign_age: Number(item.assign_age ?? 0),
    quantity: Number(item.quantity ?? 0),
    received: Number(item.received ?? 0),
  }));
};

const productItems = async (productId) => {
  productId = validate(productItemsValidation, productId);

  const result = await prismaClient.$queryRaw`SELECT
	projectitems.projectitem_id,
	projects.batch_id,
	users.full_name AS pic_name,
	tailors.tailor_name,
	products.product_name,
	variants.variant_name,
  projectitems.status,
	projectitems.assign_date,
	DATEDIFF(CURDATE(), projectitems.assign_date) AS assign_age,
	projectitems.quantity,
	sum(inbounds.quantity) AS received,
	projectitems.created_at,
	users.username AS created_by
FROM
	projectitems
	JOIN projects ON projectitems.project_id = projects.project_id
	JOIN users ON projectitems.pic_id = users.user_id
	JOIN tailors ON projectitems.tailor_id = tailors.tailor_id
	JOIN products ON projectitems.product_id = products.product_id
	JOIN variants ON projectitems.variant_id = variants.variant_id
	LEFT JOIN inbounds ON projectitems.projectitem_id = inbounds.projectitem_id AND inbounds.status != 'CANCEL'
WHERE
  projectitems.product_id = ${productId}
	AND projectitems.status IN ('OPEN', 'PARTIAL')
GROUP BY
	projectitems.projectitem_id`;

  return result.map((item) => {
    const quantity = Number(item.quantity ?? 0);
    const received = Number(item.received ?? 0);

    return {
      ...item,
      assign_age: Number(item.assign_age ?? 0),
      quantity: quantity,
      received: received,
      remaining: quantity - received
    };
  });
};

const products = async () => {
  const result = await prismaClient.projectItem.findMany({
    where: {
      status: {
        in: [ProjectStatus.OPEN, ProjectStatus.PARTIAL],
      },
    },
    select: {
      product_id: true,
      Product: {
        select: {
          product_name: true,
        },
      },
    },
    distinct: ['product_id'],
  });

  return result.map((item) => ({
    product_id: item.product_id,
    product_name: item.Product.product_name,
  }));
};

const cancelItem = async (projectItemId) => {
  projectItemId = validate(cancelProjectItemValidation, projectItemId);

  await prismaClient.$transaction(async (tx) => {
    const countProjectItem = await tx.projectItem.count({
      where: {
        projectitem_id: projectItemId,
      },
    });

    if (countProjectItem === 0) {
      throw new ResponseError(404, constants.RECORD_NOT_FOUND);
    }

    const countInbound = await tx.inbound.count({
      where: {
        projectitem_id: projectItemId,
      },
    });

    if (countInbound > 0) {
      throw new ResponseError(409, 'Inbound already created');
    }

    const projectItem = await tx.projectItem.update({
      where: {
        projectitem_id: projectItemId,
      },
      data: {
        status: ProjectStatus.CANCEL,
      },
      select: {
        project_id: true,
      }
    });

    const allProjectItems = await tx.projectItem.findMany({
      where: {
        project_id: projectItem.project_id,
      },
      select: {
        status: true,
      },
    });

    const statuses = allProjectItems.map((item) => item.status);

    const hasPartial = statuses.includes(ProjectStatus.PARTIAL);
    const hasCancel = statuses.includes(ProjectStatus.CANCEL);
    const hasOpen = statuses.includes(ProjectStatus.OPEN);
    const hasFulfilled = statuses.includes(ProjectStatus.FULFILLED);

    let projectStatus = ProjectStatus.OPEN;

    // 1. semua sama persis
    if (statuses.every((s) => s === ProjectStatus.FULFILLED)) {
      projectStatus = ProjectStatus.FULFILLED;
    } else if (statuses.every((s) => s === ProjectStatus.OPEN)) {
      projectStatus = ProjectStatus.OPEN;
    } else if (statuses.every((s) => s === ProjectStatus.CANCEL)) {
      projectStatus = ProjectStatus.CANCEL;
    } else if (statuses.every((s) => s === ProjectStatus.PARTIAL)) {
      projectStatus = ProjectStatus.PARTIAL;
      // 2. ada PARTIAL campur apapun
    } else if (hasPartial) {
      projectStatus = ProjectStatus.PARTIAL;
      // 3. ada CANCEL + sisanya FULFILLED
    } else if (hasCancel && !hasOpen && hasFulfilled) {
      projectStatus = ProjectStatus.FULFILLED;
      // 4. ada CANCEL + sisanya OPEN
    } else if (hasCancel && !hasFulfilled && hasOpen) {
      projectStatus = ProjectStatus.OPEN;
    }

    return await tx.project.update({
      where: {
        project_id: projectItem.project_id,
      },
      data: {
        status: projectStatus,
      },
    });
  });
};

export default {
  create,
  cancel,
  search,
  projectItems,
  productItems,
  products,
  cancelItem,
};
