import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import {
  createProductValidation,
  getProductValidation,
  searchProductValidation,
  updateProductValidation,
  getVariantValidation
} from "../validations/product.validation.js";
import { validate } from "../validations/validation.js";
import constants from "../utils/constants.js";

const create = async (user, req) => {
  const createRequest = validate(createProductValidation, req);
  createRequest.created_by = user.user_id;

  const countProduct = await prismaClient.product.count({
    where: {
      product_name: createRequest.product_name,
    },
  });

  if (countProduct > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  const { variants = [], ...productData } = createRequest;

  return await prismaClient.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: productData,
      select: {
        product_id: true,
        product_name: true,
        created_at: true,
      },
    });

    if (variants.length > 0) {
      const variantData = variants.map((v) => ({
        product_id: createdProduct.product_id,
        variant_id: v.variant_id,
      }));

      await tx.productVariant.createMany({
        data: variantData,
        skipDuplicates: true,
      });
    }

    return createdProduct;
  });
};

const search = async (req) => {
  const searchRequest = validate(searchProductValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      product_name: { contains: searchRequest.search },
    };
  }

  const result = await prismaClient.product.findMany({
    where,
    include: {
      CreatedBy: {
        select: {
          full_name: true,
        },
      },
      UpdatedBy: {
        select: {
          full_name: true,
        },
      },
      ProductVariant: {
        select: {
          Variant: {
            select: {
              variant_id: true,
              variant_name: true,
            },
          },
        },
      },
    },
    take: searchRequest.size,
    skip: skip,
    orderBy: {
      product_name: "asc",
    }
  });

  const data = result.map(item => {
    return {
      product_id: item.product_id,
      fashiondesign_code: item.fashiondesign_code,
      product_name: item.product_name,
      cogs: item.cogs,
      selling_price: item.selling_price,
      variants: item.ProductVariant.map((item) => ({
        variant_id: item.Variant.variant_id,
        variant_name: item.Variant.variant_name,
      })),
      created_at: item.created_at,
      created_by: item.CreatedBy?.full_name || null,
      updated_at: item.updated_at,
      updated_by: item.UpdatedBy?.full_name || null,
    }
  })

  const total = await prismaClient.product.count({ where });

  return { data, total };
};

const get = async (productId) => {
  productId = validate(getProductValidation, productId);

  const result = await prismaClient.product.findUnique({
    where: {
      product_id: productId,
    },
    include: {
      ProductVariant: {
        select: {
          Variant: {
            select: {
              variant_id: true,
              variant_name: true,
            },
          },
        },
      }
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.RECORD_NOT_FOUND);
  }

  const { ProductVariant, ...data } = result;

  return {
    ...data,
    variants: ProductVariant.map((item) => ({
      variant_id: item.Variant.variant_id,
      variant_name: item.Variant.variant_name,
    })),
  };
};

const update = async (user, req) => {
  const updateRequest = validate(updateProductValidation, req);
  updateRequest.updated_at = new Date();
  updateRequest.updated_by = user.user_id;

  const { product_id, variants, ...newRequest } = updateRequest;

  return await prismaClient.$transaction(async (tx) => {
    // Update main product data
    await tx.product.update({
      where: { product_id },
      data: newRequest,
    });

    // Ambil data ProductVariant saat ini dari DB
    const existingProductVariants = await tx.productVariant.findMany({
      where: { product_id },
      select: { variant_id: true },
    });

    const existingVariantIds = existingProductVariants.map((pv) => pv.variant_id);
    const incomingVariantIds = variants.map((v) => v.variant_id);

    // Cari variant_id yang baru (belum ada di DB)
    const variantsToAdd = incomingVariantIds.filter(
      (id) => !existingVariantIds.includes(id)
    );

    // Cari variant_id yang harus dihapus
    const variantsToRemove = existingVariantIds.filter(
      (id) => !incomingVariantIds.includes(id)
    );

    // Tambahkan yang baru
    if (variantsToAdd.length > 0) {
      await tx.productVariant.createMany({
        data: variantsToAdd.map((variant_id) => ({
          product_id,
          variant_id,
        })),
        skipDuplicates: true,
      });
    }

    // Hapus yang tidak ada lagi
    if (variantsToRemove.length > 0) {
      await tx.productVariant.deleteMany({
        where: {
          product_id,
          variant_id: { in: variantsToRemove },
        },
      });
    }

    // Return product setelah update (optional)
    return tx.product.findUnique({
      where: { product_id },
      include: {
        ProductVariant: {
          include: {
            Variant: true,
          },
        },
      },
    });
  });
};

const getVariants = async (productId) => {
  productId = validate(getVariantValidation, productId);

  const result = await prismaClient.productVariant.findMany({
    where: {
      product_id: productId,
    },
    select: {
      Variant: {
        select: {
          variant_id: true,
          variant_name: true,
        },
      }
    }
  });

  return result.map((item) => ({
    variant_id: item.Variant.variant_id,
    variant_name: item.Variant.variant_name,
  }));
};

export default { create, search, get, update, getVariants };
