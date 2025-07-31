import { prismaClient } from "../apps/database.js";
import { validate } from "../validations/validation.js";
import {
  createFashionDesignValidation,
  removeFashionDesignValidation,
  searchFashionDesignValidation,
  updateFashionDesignValidation,
} from "../validations/fashion.design.validation.js";
import { buildS3Url } from "../utils/generate.js";
import { ResponseError } from "../errors/response.error.js";
import constants from "../utils/constants.js";

const create = async (user, req) => {
  const createRequest = validate(createFashionDesignValidation, req);
  createRequest.created_by = user.user_id;

  return await prismaClient.fashionDesign.create({
    data: createRequest,
    select: {
      sample_code: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  const searchRequest = validate(searchFashionDesignValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        {
          sample_code: { contains: searchRequest.search },
        },
        {
          Tailor: {
            tailor_name: { contains: searchRequest.search },
          },
        },
      ],
    };
  }

  const result = await prismaClient.fashionDesign.findMany({
    where,
    select: {
      fashiondesign_id: true,
      sample_code: true,
      sample_file: true,
      tailor_id: true,
      Tailor: {
        select: {
          tailor_name: true,
        },
      },
      send_sample_date: true,
      receive_sample_date: true,
      revision_date: true,
      revision_file: true,
      on_production_date: true,
      fix_sample_date: true,
      obstacle: true,
      created_at: true,
      CreatedBy: {
        select: {
          full_name: true,
        },
      },
      updated_at: true,
      UpdatedBy: {
        select: {
          full_name: true,
        },
      },
    },
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      created_at: "desc",
    },
  });

  const data = result.map((item) => {
    return {
      fashiondesign_id: item.fashiondesign_id,
      sample_code: item.sample_code,
      sample_file: buildS3Url(item.sample_file),
      tailor_id: item.tailor_id,
      tailor_name: item.Tailor.tailor_name,
      tailor_name: item.Tailor.tailor_name,
      send_sample_date: item.send_sample_date
        ? item.send_sample_date.toISOString().split("T")[0]
        : null,
      receive_sample_date: item.receive_sample_date
        ? item.receive_sample_date.toISOString().split("T")[0]
        : null,
      revision_date: item.revision_date
        ? item.revision_date.toISOString().split("T")[0]
        : null,
      revision_file: buildS3Url(item.revision_file),
      on_production_date: item.on_production_date
        ? item.on_production_date.toISOString().split("T")[0]
        : null,
      fix_sample_date: item.fix_sample_date
        ? item.fix_sample_date.toISOString().split("T")[0]
        : null,
      obstacle: item.obstacle,
      created_at: item.created_at,
      created_by: item.CreatedBy.full_name,
      updated_at: item.updated_at,
      updated_by: item.UpdatedBy?.full_name || null,
    };
  });

  const total = await prismaClient.fashionDesign.count({ where });

  return { data, total };
};

const update = async (user, req) => {
  const updateRequest = validate(updateFashionDesignValidation, req);
  updateRequest.updated_at = new Date();
  updateRequest.updated_by = user.user_id;
  const { fashiondesign_id, ...newRequest } = updateRequest;
  // Remove sample_file and revision_file if they are null
  if (newRequest.sample_file === null) {
    delete newRequest.sample_file;
  }
  if (newRequest.revision_file === null) {
    delete newRequest.revision_file;
  }

  return await prismaClient.fashionDesign.update({
    where: {
      fashiondesign_id,
    },
    data: newRequest,
  });
};

const remove = async (fashionDesignId) => {
  fashionDesignId = validate(removeFashionDesignValidation, fashionDesignId);

  const countFashionDesign = await prismaClient.fashionDesign.count({
    where: {
      fashiondesign_id: fashionDesignId,
    },
  });

  if (countFashionDesign === 0) {
    throw new ResponseError(404, constants.RECORD_NOT_FOUND);
  }

  const result = await prismaClient.fashionDesign.delete({
    where: {
      fashiondesign_id: fashionDesignId,
    },
  });

  return result;
};

export default { create, search, update, remove };