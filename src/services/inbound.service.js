import { prismaClient } from "../apps/database.js";
import { validate } from "../validations/validation.js";
import {
  cancelInboundValidation,
  createInboundValidation,
  searchInboundValidation,
} from "../validations/inbound.validation.js";
import { ResponseError } from "../errors/response.error.js";
import constants from "../utils/constants.js";
import { InboundSourceType, InboundStatus, ProjectStatus } from "../generated/prisma/index.js";

const create = async (user, req) => {
  const createRequest = validate(createInboundValidation, req);
  createRequest.created_by = user.user_id;

  const projectItemIds = createRequest.map((item) => item.projectitem_id);

  const projectItems = await prismaClient.projectItem.findMany({
    where: {
      projectitem_id: { in: projectItemIds },
    },
  });

  if (projectItems.length === 0) {
    throw new Error("No project items found.");
  }

  // Validation: all project items must belong to the same project
  const projectIdsSet = new Set(projectItems.map((item) => item.project_id));
  if (projectIdsSet.size > 1) {
    throw new Error("Request must not contain items from multiple project IDs.");
  }

  const inboundSummaries = await prismaClient.inbound.groupBy({
    by: ["projectitem_id"],
    where: {
      projectitem_id: { in: projectItemIds },
    },
    _sum: {
      quantity: true,
    },
  });

  // Create maps for fast lookup
  const requestMap = new Map(createRequest.map((item) => [item.projectitem_id, item]));
  const inboundMap = new Map(inboundSummaries.map((item) => [item.projectitem_id, item._sum.quantity]));

  const updatedProjectItemStatuses = [];
  const inboundDataToCreate = [];

  for (const item of projectItems) {
    const request = requestMap.get(item.projectitem_id);
    const previousInboundQty = inboundMap.get(item.projectitem_id) || 0;
    const currentInboundQty = request?.quantity ?? 0;
    const totalInboundQty = previousInboundQty + currentInboundQty;

    const status =
      totalInboundQty >= item.quantity
        ? ProjectStatus.FULFILLED
        : ProjectStatus.PARTIAL;

    updatedProjectItemStatuses.push({
      projectitem_id: item.projectitem_id,
      status,
    });

    inboundDataToCreate.push({
      projectitem_id: item.projectitem_id,
      pic_id: item.pic_id,
      tailor_id: item.tailor_id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      inbound_date: request.inbound_date,
      quantity: currentInboundQty,
      notes: request.notes,
      created_by: user.user_id,
    });
  }

  // Update status of each project item
  await Promise.all(
    updatedProjectItemStatuses.map((item) =>
      prismaClient.projectItem.update({
        where: { projectitem_id: item.projectitem_id },
        data: { status: item.status },
      })
    )
  );

  // Check if all project items are FULFILLED for this project
  const projectId = projectItems[0].project_id;

  const allProjectItems = await prismaClient.projectItem.findMany({
    where: { project_id: projectId },
    select: { status: true },
  });

  const statuses = allProjectItems.map((item) => item.status);

  if (statuses.every((s) => s === ProjectStatus.FULFILLED)) {
    await prismaClient.project.update({
      where: { project_id: projectId },
      data: { status: ProjectStatus.FULFILLED },
    });
  } else if (statuses.includes(ProjectStatus.PARTIAL)) {
    await prismaClient.project.update({
      where: { project_id: projectId },
      data: { status: ProjectStatus.PARTIAL },
    });
  }

  // Insert new inbound data
  return await prismaClient.inbound.createMany({
    data: inboundDataToCreate,
  });
};

const cancel = async (inboundId) => {
  inboundId = validate(cancelInboundValidation, inboundId);

  await prismaClient.$transaction(async (tx) => {
    const inbound = await tx.inbound.findFirst({
      where: {
        inbound_id: inboundId,
      },
      select: {
        inbound_id: true,
        projectitem_id: true,
      },
    });

    if (!inbound) {
      throw new ResponseError(404, constants.RECORD_NOT_FOUND);
    }

    await tx.inbound.update({
      where: {
        inbound_id: inboundId,
      },
      data: {
        status: InboundStatus.CANCEL,
      },
    });

    if (!inbound.projectitem_id) {
      return;
    }

    const projectItem = await tx.projectItem.findFirst({
      where: {
        projectitem_id: inbound.projectitem_id,
      },
      select: {
        projectitem_id: true,
        project_id: true,
        quantity: true,
      },
    });

    if (!projectItem) {
      throw new ResponseError(404, constants.RECORD_NOT_FOUND);
    }

    const inboundSummary = await tx.inbound.aggregate({
      where: {
        projectitem_id: inbound.projectitem_id,
        status: InboundStatus.OK,
      },
      _sum: {
        quantity: true,
      },
    });

    const totalInboundQty = Number(inboundSummary._sum.quantity || 0);

    let projectItemStatus = ProjectStatus.OPEN;
    if (totalInboundQty >= projectItem.quantity) {
      projectItemStatus = ProjectStatus.FULFILLED;
    } else if (totalInboundQty > 0) {
      projectItemStatus = ProjectStatus.PARTIAL;
    }

    await tx.projectItem.update({
      where: {
        projectitem_id: inbound.projectitem_id,
      },
      data: {
        status: projectItemStatus,
      },
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

    let projectStatus = ProjectStatus.OPEN;
    if (statuses.every((status) => status === ProjectStatus.FULFILLED)) {
      projectStatus = ProjectStatus.FULFILLED;
    } else if (statuses.includes(ProjectStatus.PARTIAL) || statuses.includes(ProjectStatus.FULFILLED)) {
      projectStatus = ProjectStatus.PARTIAL;
    }

    await tx.project.update({
      where: {
        project_id: projectItem.project_id,
      },
      data: {
        status: projectStatus,
      },
    });
  });
};

const search = async (req) => {
  const searchRequest = validate(searchInboundValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;

  let where = {
    source_type: InboundSourceType.PROJECT
  };
  if (searchRequest.search) {
    where = {
      ...where,
      OR: [
        { notes: { contains: searchRequest.search } },
        {
          ProjectItem: {
            is: {
              Project: {
                is: {
                  batch_id: {
                    contains: searchRequest.search,
                  },
                },
              },
            },
          },
        },
        {
          Pic: {
            is: {
              full_name: {
                contains: searchRequest.search,
              },
            },
          },
        },
        {
          Tailor: {
            is: {
              tailor_name: {
                contains: searchRequest.search,
              },
            },
          },
        },
        {
          Product: {
            is: {
              product_name: {
                contains: searchRequest.search,
              },
            },
          },
        },
        {
          Variant: {
            is: {
              variant_name: {
                contains: searchRequest.search,
              },
            },
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
      Pic: {
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
      CreatedBy: {
        select: {
          full_name: true,
        },
      },
      inbound_date: true,
      quantity: true,
      notes: true,
      status: true,
      created_at: true,
    },
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      created_at: "desc"
    },
  });

  // Calculate assignment_age in JavaScript
  const data = items.map((item) => ({
    inbound_id: item.inbound_id,
    batch_id: item.ProjectItem.Project.batch_id,
    pic_name: item.Pic.full_name,
    tailor_name: item.Tailor.tailor_name,
    product_name: item.Product.product_name,
    variant_name: item.Variant.variant_name,
    assign_date: item.ProjectItem.assign_date,
    inbound_date: item.inbound_date,
    quantity: item.quantity,
    notes: item.notes,
    status: item.status,
    created_at: item.created_at,
    created_by: item.CreatedBy.full_name,
  }));

  const total = await prismaClient.inbound.count({ where });

  return { data, total };
};

export default { create, cancel, search };
