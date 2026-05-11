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
  if (!payload.products?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Products are required");
  }

  payload.createdBy = user.userId;

  const purchase = await ProductPurchase.create(payload);

  // STOCK ADD
  if (purchase.purchaseStatus === PurchaseStatus.RECEIVED) {
    for (const item of purchase.products) {
      const product = await Product.findById(item.product);

      if (!product) continue;

      product.totalAddedStock = (product.totalAddedStock || 0) + item.quantity;

      product.availableStock = (product.availableStock || 0) + item.quantity;

      await product.save();
    }
  }

  return purchase;
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

  // rollback old stock
  if (purchase.purchaseStatus === PurchaseStatus.RECEIVED) {
    for (const item of purchase.products) {
      const product = await Product.findById(item.product);

      if (!product) continue;

      product.totalAddedStock = Math.max(
        (product.totalAddedStock || 0) - item.quantity,
        0,
      );

      product.availableStock = Math.max(
        (product.availableStock || 0) - item.quantity,
        0,
      );

      await product.save();
    }
  }

  Object.assign(purchase, payload);

  // apply new stock
  if (purchase.purchaseStatus === PurchaseStatus.RECEIVED) {
    for (const item of purchase.products) {
      const product = await Product.findById(item.product);

      if (!product) continue;

      product.totalAddedStock = (product.totalAddedStock || 0) + item.quantity;

      product.availableStock = (product.availableStock || 0) + item.quantity;

      await product.save();
    }
  }

  await purchase.save();

  return purchase;
};

const updatePurchaseStatus = async (
  id: string,
  payload: {
    purchaseStatus?: PurchaseStatus;
    paymentStatus?: string;
  },
) => {
  const purchase = await ProductPurchase.findById(id);

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, "Purchase not found");
  }

  const oldPurchaseStatus = purchase.purchaseStatus;

  const newPurchaseStatus = payload.purchaseStatus ?? oldPurchaseStatus;

  // prevent duplicate stock update
  if (oldPurchaseStatus !== newPurchaseStatus) {
    // rollback old stock
    if (oldPurchaseStatus === PurchaseStatus.RECEIVED) {
      for (const item of purchase.products) {
        const product = await Product.findById(item.product);

        if (!product) continue;

        product.totalAddedStock = Math.max(
          (product.totalAddedStock || 0) - item.quantity,
          0,
        );

        product.availableStock = Math.max(
          (product.availableStock || 0) - item.quantity,
          0,
        );

        await product.save();
      }
    }

    // apply new stock
    if (newPurchaseStatus === PurchaseStatus.RECEIVED) {
      for (const item of purchase.products) {
        const product = await Product.findById(item.product);

        if (!product) continue;

        product.totalAddedStock =
          (product.totalAddedStock || 0) + item.quantity;

        product.availableStock = (product.availableStock || 0) + item.quantity;

        await product.save();
      }
    }

    purchase.purchaseStatus = newPurchaseStatus;
  }

  // payment status update
  if (payload.paymentStatus) {
    purchase.paymentStatus = payload.paymentStatus as any;
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

  if (purchase.purchaseStatus === PurchaseStatus.RECEIVED) {
    for (const item of purchase.products) {
      const product = await Product.findById(item.product);

      if (!product) continue;

      product.totalAddedStock = Math.max(
        (product.totalAddedStock || 0) - item.quantity,
        0,
      );

      product.availableStock = Math.max(
        (product.availableStock || 0) - item.quantity,
        0,
      );

      await product.save();
    }
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
