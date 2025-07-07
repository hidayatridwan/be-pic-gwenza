import { prismaClient } from "../apps/database.js";
import { validate } from "../validations/validation.js";
import {
  createFashionDesignValidation,
  removeFashionDesignValidation,
  searchFashionDesignValidation,
  updateFashionDesignValidation,
} from "../validations/fashion.design.validation.js";

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

  const data = await prismaClient.fashionDesign.findMany({
    where,
    include: {
      Tailor: true,
    },
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      sample_code: "asc",
    },
  });

  const mappedData = data.map((item) => {
    const { Tailor, ...rest } = item;
    return {
      ...rest,
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
      on_production_date: item.on_production_date
        ? item.on_production_date.toISOString().split("T")[0]
        : null,
      fix_sample_date: item.fix_sample_date
        ? item.fix_sample_date.toISOString().split("T")[0]
        : null,
      sample_file: buildS3Url(item.sample_file),
      revision_file: buildS3Url(item.revision_file),
    };
  });

  const total = await prismaClient.fashionDesign.count({ where });

  return { data: mappedData, total };
};

const update = async (req) => {
  const updateRequest = validate(updateFashionDesignValidation, req);
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

function buildS3Url(path) {
  if (!path) return null;
  const baseUrl = process.env.S3_URL?.replace(/\/$/, "") || "";
  const bucket = process.env.S3_BUCKET?.replace(/\/$/, "") || "";
  const filePath = path.replace(/^\//, "");
  return `${baseUrl}/${bucket}/${filePath}`;
}
