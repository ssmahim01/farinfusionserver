import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { QueryBuilder } from "../../utils/QueryBuilder";

import { ProductVerification } from "./productVerification.model";
import { IProductVerification } from "./productVerification.interface";
import { verificationSearchableFields } from "./productVerification.constants";
import slugify from "slugify";
import mongoose from "mongoose";

const createProductVerification = async (payload: IProductVerification) => {
  const slug = slugify(payload.title, {
    lower: true,
    strict: true,
    trim: true,
  });

  payload.slug = slug;
  const isExist = await ProductVerification.findOne({
    $or: [{ title: payload.title }, { slug }],
    isDeleted: false,
  });

  if (isExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "Content already exists");
  }

  return await ProductVerification.create(payload);
};

const increaseView = async (id: string) => {
  const result = await ProductVerification.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
      status: "PUBLISHED",
    },
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
      projection: {
        views: 1,
      },
    },
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Content not found");
  }

  return result;
};

const getAllProductVerifications = async (query: Record<string, any>) => {
  const filterQuery: Record<string, any> = {
    isDeleted: false,
  };

  if (query.status) {
    filterQuery.status = query.status;
  }

  if (query.mediaType) {
    filterQuery.mediaType = query.mediaType;
  }

  if (query.category) {
    filterQuery.category = query.category;
  }

  if (query.featured !== undefined && query.featured !== "") {
    filterQuery.featured = query.featured === "true";
  }

  const queryBuilder = new QueryBuilder(
    ProductVerification.find(filterQuery),
    query,
  );

  const data = await queryBuilder
    .search(verificationSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("createdBy", "name email").populate("product", "title slug images");

  const meta = await queryBuilder.getMeta();

  return {
    data,
    meta,
  };
};

const getSingleProductVerification = async (idOrSlug: string) => {
  const filter = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? {
        _id: idOrSlug,
        isDeleted: false,
      }
    : {
        slug: idOrSlug,
        isDeleted: false,
      };

  const result = await ProductVerification.findOneAndUpdate(
    filter,
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    },
  ).populate("createdBy", "name email").populate("product", "title slug images");

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Content not found");
  }

  return result;
};

const updateProductVerification = async (
  id: string,
  payload: Partial<IProductVerification>,
) => {
  const verification = await ProductVerification.findById(id);

  if (!verification || verification.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Content not found");
  }

  if (payload.title) {
    payload.slug = slugify(payload.title, {
      lower: true,
      strict: true,
      trim: true,
    });

    const duplicate = await ProductVerification.findOne({
      _id: { $ne: id },
      slug: payload.slug,
      isDeleted: false,
    });

    if (duplicate) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Another content already uses this title",
      );
    }
  }

  return await ProductVerification.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const deleteProductVerification = async (id: string) => {
  const exists = await ProductVerification.findById(id);

  if (!exists || exists.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Content not found");
  }

  return await ProductVerification.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
    },
    {
      new: true,
    },
  );
};

export const ProductVerificationServices = {
  createProductVerification,
  getAllProductVerifications,
  getSingleProductVerification,
  updateProductVerification,
  deleteProductVerification,
  increaseView,
};
