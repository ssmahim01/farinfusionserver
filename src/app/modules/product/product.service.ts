import httpStatus from 'http-status-codes';
import AppError from '../../errorHelpers/appError';
import { Product } from './product.model';
import { productSearchableFields } from './product.constants';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { deleteImageFromCloudinary } from '../../config/cloudinary.config';
import mongoose from "mongoose";
import { ICategory } from '../category/category.interface';
import { IProduct } from './product.interface';


// const createProductService = async (payload: Partial<IProduct>) => {
//   const isProductExist = await Product.findOne({ name: payload.title });
//   if (isProductExist) {
//     throw new AppError(httpStatus.CONFLICT, "Product with this title already exists");
//   }

//   const totalAddedStock = payload.totalAddedStock || 0;
//   const totalSold = payload.totalSold || 0;

//   payload.availableStock = totalAddedStock - totalSold;

//   const product = await Product.create(payload);
//   return product;
// };

const createProductService = async (payload: Partial<IProduct>) => {
  const isProductExist = await Product.findOne({ title: payload.title });
  if (isProductExist) {
    throw new AppError(httpStatus.CONFLICT, "Product already exists");
  }

  const availableStock = payload.availableStock ?? 0;

  payload.availableStock = availableStock;
  payload.totalAddedStock = availableStock;
  payload.totalSold = 0;

  const product = await Product.create(payload);
  return product;
};

// const updateProduct = async (
//   productId: string,
//   payload: Partial<IProduct>
// ) => {
//   const existingProduct = await Product.findById(productId);

//   if (!existingProduct) {
//     throw new AppError(httpStatus.NOT_FOUND, "Product not found");
//   }

//     if (payload.totalAddedStock !== undefined || payload.totalSold !== undefined) {

//     const product = await Product.findById(productId);

//     const totalAddedStock = payload.totalAddedStock ?? product?.totalAddedStock ?? 0;
//     const totalSold = payload.totalSold ?? product?.totalSold ?? 0;

//     payload.availableStock = totalAddedStock - totalSold;
//   }

//   const updatedProduct = await Product.findByIdAndUpdate(
//     productId,
//     payload,
//     { new: true, runValidators: true }
//   );

//   return updatedProduct;

// };

const updateProduct = async (
  productId: string,
  payload: Partial<IProduct>
) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  // 🟢 Admin overwrite stock
  if (payload?.totalAddedStock !== undefined) {
    product.availableStock = payload.totalAddedStock
  }

  // 🔹 Always maintain totalAddedStock
  product.totalAddedStock = (product.availableStock ?? 0) + (product.totalSold ?? 0);

  // 🔹 Update other fields
  const updatableFields = { ...payload };
  delete updatableFields.availableStock; // already handled
  Object.assign(product, updatableFields);

  await product.save();
  return product;
};


const getSingleProduct = async (slug: string) => {
  const product = await Product.findOne({ slug })
      .populate("category", "title")
      .populate("brand", "title");
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product Not Found")
  }
  return {
    data: product
  }
};

const deleteProduct = async (id: string) => {

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product Not Found");
  }

  if (product.images && product.images.length > 0) {
    await Promise.all(
      product.images.map((image) => deleteImageFromCloudinary(image))
    );
  }

  await Product.findByIdAndDelete(id);

  return { data: null };
};

const getAllProducts = async (query: Record<string, string>) => {
  const queryObj: any = {};

  // DATE FILTER
  if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
    queryObj.createdAt = {};

    if (query["createdAt[gte]"]) {
      queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
    }

    if (query["createdAt[lte]"]) {
      queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
    }
  }

  // REMOVE SPECIAL FIELDS
  delete query["createdAt[gte]"];
  delete query["createdAt[lte]"];

  const queryBuilder = new QueryBuilder(Product.find({isDeleted: false, ...queryObj}).populate('category'), query)
  const productsData = queryBuilder
    .filter()
    .search(productSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    productsData.build(),
    queryBuilder.getMeta()
  ])

  return {
    data,
    meta
  }
};

const getAllTrashProducts = async (query: Record<string, string>) => {
  const queryObj: any = {};

  // DATE FILTER
  if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
    queryObj.createdAt = {};

    if (query["createdAt[gte]"]) {
      queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
    }

    if (query["createdAt[lte]"]) {
      queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
    }
  }

  // REMOVE SPECIAL FIELDS
  delete query["createdAt[gte]"];
  delete query["createdAt[lte]"];

  const queryBuilder = new QueryBuilder(Product.find({isDeleted: true, ...queryObj}).populate('category'), query)
  const productsData = queryBuilder
    .filter()
    .search(productSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    productsData.build(),
    queryBuilder.getMeta()
  ])

  return {
    data,
    meta
  }
};

export const CategoryServices = {
  createProductService,
  updateProduct,
  getSingleProduct,
  deleteProduct,
  getAllProducts,
  getAllTrashProducts,
}
