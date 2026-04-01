/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { POSOrder } from "./pos.model";
import { Product } from "../product/product.model";

const createPOSOrder = async (payload: any, userId: string) => {
  const { products, customer, orderType } = payload;

  if (!products || products.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "No products selected");
  }

  let subtotal = 0;

  const processedProducts = [];

  for (const item of products) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    if (product?.availableStock ?? 0 < item.quantity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `${product.title} is out of stock`
      );
    }

    const price = product.discountPrice || product.price;

    subtotal += price * item.quantity;

    processedProducts.push({
      product: product._id,
      quantity: item.quantity,
      price,
    });

    product.availableStock = (product.availableStock ?? 0) - item.quantity;
    await product.save();
  }

  const tax = subtotal * 0.15;
  const deliveryFee = orderType === "DELIVERY" ? 100 : 0;
  const total = subtotal + tax + deliveryFee;

  const order = await POSOrder.create({
    products: processedProducts,
    customer,
    orderType,
    subtotal,
    tax,
    deliveryFee,
    total,
    createdBy: userId,
  });

  return order;
};

const getAllPOSOrders = async () => {
  return POSOrder.find().sort({ createdAt: -1 });
};

const getSinglePOSOrder = async (id: string) => {
  return POSOrder.findById(id).populate("products.product");
};

const updatePOSOrderStatus = async (id: string, status: string) => {
  return POSOrder.findByIdAndUpdate(
    id,
    { status },
    { returnDocument: "after" }
  );
};

export const POSServices = {
  createPOSOrder,
  getAllPOSOrders,
  getSinglePOSOrder,
  updatePOSOrderStatus,
};