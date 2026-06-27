import httpStatus from "http-status-codes";
import slugify from "slugify";
import mongoose from "mongoose";

import AppError from "../../errorHelpers/appError";
import { QueryBuilder } from "../../utils/QueryBuilder";

import { ProductBlog } from "./productBlog.model";
import { IProductBlog } from "./productBlog.interface";
import { productBlogSearchableFields } from "./productBlog.constants";

const createProductBlog = async (payload: IProductBlog) => {
  const slug = slugify(payload.title, {
    lower: true,
    strict: true,
    trim: true,
  });

  payload.slug = slug;

  const exists = await ProductBlog.findOne({
    $or: [{ title: payload.title }, { slug }],
    isDeleted: false,
  });

  if (exists) {
    throw new AppError(httpStatus.BAD_REQUEST, "Blog already exists");
  }

  return await ProductBlog.create(payload);
};

const getAllProductBlogs = async (query: Record<string, string>) => {
  const queryObj: Record<string, unknown> = {
    isDeleted: false,
  };

  if (query.status) {
    queryObj.status = query.status;
  }

  if (query.category) {
    queryObj.category = query.category;
  }

  if (query.contentType) {
    queryObj.contentType = query.contentType;
  }

  if (query.featured !== undefined) {
    queryObj.featured = query.featured === "true";
  }

  const queryBuilder = new QueryBuilder(ProductBlog.find(queryObj), query);

  const data = await queryBuilder
    .search(productBlogSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("createdBy", "name email");

  const meta = await queryBuilder.getMeta();

  return {
    meta,
    data,
  };
};

const getSingleProductBlog = async (idOrSlug: string) => {
  const filter = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? {
        _id: idOrSlug,
        isDeleted: false,
      }
    : {
        slug: idOrSlug,
        isDeleted: false,
      };

  const result = await ProductBlog.findOne(filter).populate(
    "createdBy",
    "name email",
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
  }

  return result;
};

const updateProductBlog = async (
  id: string,
  payload: Partial<IProductBlog>,
) => {
  const exists = await ProductBlog.findById(id);

  if (!exists || exists.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
  }

  if (payload.title) {
    payload.slug = slugify(payload.title, {
      lower: true,
      strict: true,
      trim: true,
    });

    const duplicate = await ProductBlog.findOne({
      _id: {
        $ne: id,
      },
      slug: payload.slug,
      isDeleted: false,
    });

    if (duplicate) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Another blog already exists with this title",
      );
    }
  }

  return await ProductBlog.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const deleteProductBlog = async (id: string) => {
  const exists = await ProductBlog.findById(id);

  if (!exists || exists.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
  }

  return await ProductBlog.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
    },
    {
      new: true,
    },
  );
};

const increaseView = async (id: string) => {
  const result = await ProductBlog.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
      status: "PUBLISHED",
    },
    {
      $inc: {
        views: 1,
      },
      $set: {
        lastViewedAt: new Date(),
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
    throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
  }

  return result;
};

export const ProductBlogServices = {
  createProductBlog,
  getAllProductBlogs,
  getSingleProductBlog,
  updateProductBlog,
  deleteProductBlog,
  increaseView,
};
