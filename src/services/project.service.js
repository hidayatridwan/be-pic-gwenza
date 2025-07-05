import { prismaClient } from "../apps/database.js";
import { validate } from "../validations/validation.js";
import {
  cancelProjectValidation,
  createProjectValidation,
  getItemByProjectIdValidation,
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

  await prismaClient.$transaction(async (tx) => {
    const countProject = await tx.project.count({
      where: {
        project_id: projectId,
      },
    });

    if (countProject === 0) {
      throw new ResponseError(404, constants.RECORD_NOT_FOUND);
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
        status: "CANCEL",
      },
    });

    return await tx.project.updateMany({
      where: {
        project_id: projectId,
      },
      data: {
        status: "CANCEL",
      },
    });
  });
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
      pic_name: item.User.full_name,
      created_at: item.created_at,
    };
  });

  const total = await prismaClient.project.count({ where });

  return { data, total };
};

const getItemByProjectId = async (projectId) => {
  projectId = validate(getItemByProjectIdValidation, projectId);

  const results = await prismaClient.$queryRaw`SELECT
	projectitems.projectitem_id,
	projects.batch_id,
	users.full_name AS pic_name,
	tailors.tailor_name,
	products.product_name,
	variants.variant_name,
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

  // Convert BigInt values to string
  return results.map((row) => {
    const converted = {};
    for (const key in row) {
      const value = row[key];
      converted[key] = typeof value === "bigint" ? value.toString() : value;
    }
    return converted;
  });
};

export default {
  create,
  cancel,
  searchProject,
  getItemByProjectId,
};
