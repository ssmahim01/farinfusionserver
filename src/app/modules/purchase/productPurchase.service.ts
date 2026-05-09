import { JwtPayload } from "jsonwebtoken";
import { Product } from "../product/product.model";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status-codes";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IProductPurchase, PurchaseStatus } from "./productPurchase.interface";
import { ProductPurchase } from "./productPurchase.model";
import { productPurchaseSearchableFields } from "./productPurchase.constant";

const createPurchase = async (
  payload: Partial<IProductPurchase>,
  user: JwtPayload,
) => {
  const product = await Product.findById(payload.product);

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  payload.createdBy = user.userId;

  const purchase = await ProductPurchase.create(payload);

  if (purchase.purchaseStatus === PurchaseStatus.RECEIVED) {
    product.totalAddedStock =
      (product.totalAddedStock || 0) + purchase.quantity;

    product.availableStock = (product.availableStock || 0) + purchase.quantity;

    await product.save();
  }

  return purchase;
};

const getAllPurchases = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    ProductPurchase.find({ isDeleted: false })
      .populate("product")
      .populate("createdBy", "name email"),
    query,
  );

  const purchasesData = queryBuilder
    .filter()
    .search(productPurchaseSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    purchasesData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getSinglePurchase = async (id: string) => {
  const purchase = await ProductPurchase.findById(id)
    .populate("product")
    .populate("createdBy", "name email");

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, "Purchase not found");
  }

  return purchase;
};

const updatePurchase = async (
  id: string,
  payload: Partial<IProductPurchase>,
) => {
  const purchase = await ProductPurchase.findById(id);

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, "Purchase not found");
  }

  const product = await Product.findById(purchase.product);

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  const oldQuantity = purchase.quantity;
  const newQuantity = payload.quantity ?? oldQuantity;

  const oldStatus = purchase.purchaseStatus;
  const newStatus = payload.purchaseStatus ?? oldStatus;

  // SAFE DEFAULT VALUES
  const currentTotalAddedStock = product.totalAddedStock ?? 0;
  const currentAvailableStock = product.availableStock ?? 0;

  // rollback old stock
  if (oldStatus === PurchaseStatus.RECEIVED) {
    product.totalAddedStock = currentTotalAddedStock - oldQuantity;

    product.availableStock = currentAvailableStock - oldQuantity;
  }

  // apply new stock
  if (newStatus === PurchaseStatus.RECEIVED) {
    product.totalAddedStock = (product.totalAddedStock ?? 0) + newQuantity;

    product.availableStock = (product.availableStock ?? 0) + newQuantity;
  }

  // prevent negative stock
  product.totalAddedStock = Math.max(product.totalAddedStock ?? 0, 0);

  product.availableStock = Math.max(product.availableStock ?? 0, 0);

  await product.save();

  Object.assign(purchase, payload);

  await purchase.save();

  return purchase;
};

const updatePurchaseStatus = async (id: string, status: PurchaseStatus) => {
  const purchase = await ProductPurchase.findById(id);

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, "Purchase not found");
  }

  const product = await Product.findById(purchase.product);

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  const oldStatus = purchase.purchaseStatus;

  // already same status
  if (oldStatus === status) {
    return purchase;
  }

  // rollback old stock if previous status was RECEIVED
  if (oldStatus === PurchaseStatus.RECEIVED) {
    product.totalAddedStock = Math.max(
      (product.totalAddedStock ?? 0) - purchase.quantity,
      0,
    );

    product.availableStock = Math.max(
      (product.availableStock ?? 0) - purchase.quantity,
      0,
    );
  }

  // apply stock if new status is RECEIVED
  if (status === PurchaseStatus.RECEIVED) {
    product.totalAddedStock =
      (product.totalAddedStock ?? 0) + purchase.quantity;

    product.availableStock = (product.availableStock ?? 0) + purchase.quantity;
  }

  purchase.purchaseStatus = status;

  await product.save();
  await purchase.save();

  return purchase;
};

const deletePurchase = async (id: string) => {
  const purchase = await ProductPurchase.findById(id);

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, "Purchase not found");
  }

  const product = await Product.findById(purchase.product);

  if (product && purchase.purchaseStatus === PurchaseStatus.RECEIVED) {
    const currentTotalAddedStock = product.totalAddedStock ?? 0;

    const currentAvailableStock = product.availableStock ?? 0;

    product.totalAddedStock = currentTotalAddedStock - purchase.quantity;

    product.availableStock = currentAvailableStock - purchase.quantity;

    product.totalAddedStock = Math.max(product.totalAddedStock ?? 0, 0);

    product.availableStock = Math.max(product.availableStock ?? 0, 0);

    await product.save();
  }

  purchase.isDeleted = true;

  await purchase.save();

  return null;
};

export const ProductPurchaseServices = {
  createPurchase,
  getAllPurchases,
  getSinglePurchase,
  updatePurchase,
  updatePurchaseStatus,
  deletePurchase,
};
