/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errorHelpers/appError";
import { POSOrder } from "./pos.model";
import { Product } from "../product/product.model";

const createPOSOrder = async (payload: any, userId: string) => {

  if (!payload) {
    throw new AppError(400, "Payload is missing");
  }

  const {
    items,
    subtotal,
    tax,
    deliveryFee,
    total,
    orderType,

    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    customerCity,
    customerZipCode,
    notes,
  } = payload;

  if (!items || items.length === 0) {
    throw new AppError(400, "Cart is empty");
  }

  const processedProducts = [];

  for (const item of items) {
    const product = await Product.findById(item.product._id);

    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if ((product?.availableStock ?? 0) < item.quantity) {
      throw new AppError(
        400,
        `${product.title} is out of stock`
      );
    }

    const price = product.discountPrice || product.price;

    processedProducts.push({
      product: product._id,
      quantity: item.quantity,
      price,
    });

   product.availableStock = (product.availableStock ?? 0) - item.quantity;
    await product.save();
  }

  const order = await POSOrder.create({
    products: processedProducts,

    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      address: customerAddress,
      city: customerCity,
      zipCode: customerZipCode,
      notes,
    },

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