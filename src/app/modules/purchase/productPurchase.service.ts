import { JwtPayload } from "jsonwebtoken";
import { Product } from "../product/product.model";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status-codes";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  IProductPurchase,
  PaymentStatus,
  PurchaseStatus,
} from "./productPurchase.interface";
import { ProductPurchase } from "./productPurchase.model";
import { productPurchaseSearchableFields } from "./productPurchase.constant";

const createPurchase = async (
  payload: Partial<IProductPurchase>,
  user: JwtPayload,
) => {
  if (!payload.products?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Products are required");
  }

  let grandTotal = 0;

  for (const item of payload.products) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    item.quantity = Number(item.quantity);
    item.buyingPrice = Number(item.buyingPrice);
    item.totalAmount = item.quantity * item.buyingPrice;

    grandTotal += item.totalAmount;
  }

  payload.grandTotal = grandTotal;
  payload.createdBy = user.userId;

  const purchase = await ProductPurchase.create(payload);

  return await ProductPurchase.findById(purchase._id)
    .populate("products.product")
    .populate("createdBy", "name email");
};

const getAllPurchases = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    ProductPurchase.find({ isDeleted: false })
      .populate("products.product")
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
    .populate("products.product")
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

  if (payload.products?.length) {
    let grandTotal = 0;

    for (const item of payload.products) {
      const product = await Product.findById(item.product);

      if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
      }

      item.quantity = Number(item.quantity);
      item.buyingPrice = Number(item.buyingPrice);
      item.totalAmount = item.quantity * item.buyingPrice;

      grandTotal += item.totalAmount;
    }

    payload.grandTotal = grandTotal;
  }

  Object.assign(purchase, payload);

  await purchase.save();

  return await ProductPurchase.findById(id)
    .populate("products.product")
    .populate("createdBy", "name email");
};

const updatePurchaseStatus = async (
  id: string,
  payload: {
    purchaseStatus?: PurchaseStatus;
    paymentStatus?: PaymentStatus;
  },
) => {
  const purchase = await ProductPurchase.findById(id);

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, "Purchase not found");
  }

  if (payload.purchaseStatus) {
    purchase.purchaseStatus = payload.purchaseStatus;
  }

  if (payload.paymentStatus) {
    purchase.paymentStatus = payload.paymentStatus;
  }

  await purchase.save();

  return await ProductPurchase.findById(id)
    .populate("products.product")
    .populate("createdBy", "name email");
};

const getPurchaseStats = async () => {
  const purchases = await ProductPurchase.find({
    isDeleted: false,
  }).populate("products.product");

  const totalPurchases = purchases.length;

  const totalAmount = purchases.reduce(
    (sum, purchase: any) => sum + (purchase.grandTotal || 0),
    0,
  );

  const pendingPayments = purchases.filter(
    (purchase) => purchase.paymentStatus !== "PAID",
  ).length;

  const totalProfit = purchases.reduce((sum: number, purchase: any) => {
    const purchaseProfit =
      purchase.products?.reduce((acc: number, item: any) => {
        const sellingPrice = item.product?.price || 0;

        const buyingPrice = item.buyingPrice || 0;

        return acc + (sellingPrice - buyingPrice) * item.quantity;
      }, 0) || 0;

    return sum + purchaseProfit;
  }, 0);

  return {
    totalPurchases,
    totalAmount,
    totalProfit,
    pendingPayments,
  };
};

const deletePurchase = async (id: string) => {
  const purchase = await ProductPurchase.findById(id);

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, "Purchase not found");
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
  getPurchaseStats,
  deletePurchase,
};
