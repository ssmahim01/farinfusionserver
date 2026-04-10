/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from "http-status-codes";
import mongoose, { Types } from "mongoose";
import { IOrderProduct, OrderStatus, OrderType } from "./order.interface";
import { Counter, Order } from "./order.model";
import { calculateOrderPrice } from "../../utils/calculateOrderTotal";
import { Payment } from "../payment/payment.model";
import { PaymentMethod, PaymentStatus } from "../payment/payment.interface";
import { Product } from "../product/product.model";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/appError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { orderSearchableFields } from "./order.constants";
import { Role } from "../user/user.interface";
import { CourierServices } from "../courier/courier.service";

interface TCreateOrderPayload {
  orderType: OrderType;
  paymentMethod?: PaymentMethod;
  total: number;
  discount?: number;
  products: IOrderProduct[];
  note: string;
  shippingCost?: number;

  billingDetails: {
    fullName?: string;
    email: string;
    phone?: string;
    address?: string;
  };
  user?: string;
  seller?: string;
}

const getTransactionId = () => {
  return `Tran_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

const createOrder = async (payload: TCreateOrderPayload) => {
  const session = await mongoose.startSession();

  let updatedOrder;

  try {
    session.startTransaction();

    /* ---------- ORDER ID GENERATOR ---------- */

    const getNextCustomOrderId = async (
      session: mongoose.ClientSession,
    ): Promise<number> => {
      let counter = await Counter.findById("orderId").session(session);

      if (!counter) {
        const newCounter = new Counter({
          _id: "orderId",
          seq: 1000,
        });

        await newCounter.save({ session });
        counter = newCounter;
      }

      counter.seq += 1;
      await counter.save({ session });

      return counter.seq;
    };

    const customOrderId = await getNextCustomOrderId(session);

    /* ---------- CALCULATE ORDER PRICE ---------- */

    const calculatedOrder = await calculateOrderPrice(
      payload.products,
      payload.shippingCost || 0,
    );

    /* ---------- ORDER DOC ---------- */

    const orderDoc: any = {
      customOrderId: `ORD-${customOrderId}`,
      orderType: payload.orderType,

      products: calculatedOrder.productsWithPrice,

      subtotal: calculatedOrder.subtotal,
      shippingCost: calculatedOrder.shippingCost,
      total: payload?.total,
      discount: payload?.discount || 0,

      orderStatus: OrderStatus.PENDING,
    };

    const isUserExist = await User.findOne({
      email: payload?.billingDetails?.email,
    }).session(session);

    if (isUserExist) {
      orderDoc.customer = isUserExist?._id;
    }

    if (payload.billingDetails) {
      orderDoc.billingDetails = payload.billingDetails;
    }

    if (payload.orderType === OrderType.POS) {
      if (!payload.seller) {
        throw new AppError(httpStatus.BAD_REQUEST, "Seller required");
      }
      orderDoc.seller = payload.seller;
    }

    const [order] = await Order.create([orderDoc], { session });
    const orderId = order._id;

    const transactionId = getTransactionId();

    const [payment] = await Payment.create(
      [
        {
          order: orderId,
          transactionId,
          amount: calculatedOrder.totalPrice,

          paymentStatus:
            payload.paymentMethod === PaymentMethod.COD
              ? PaymentStatus.PAID
              : PaymentStatus.UNPAID,

          paymentMethod: payload.paymentMethod,
        },
      ],
      { session },
    );

    updatedOrder = await Order.findByIdAndUpdate(
      orderId,

      {
        payment: payment._id,
        transactionId,

        orderStatus: OrderStatus.PENDING,
        note: payload.note || "Auto generated order",
      },
      { returnDocument: "after", session },
    )
      .populate("customer", "name email _id role phone")
      .populate("seller", "name email _id role phone")
      .populate("products.product");

    await Promise.all(
      payload.products.map(async (p) => {
        const product = await Product.findById(p.product).session(session);

        if (product) {
          product.totalSold = (product.totalSold || 0) + p.quantity;
          product.availableStock = (product.availableStock ?? 0) - p.quantity;
          await product.save({ session });
        }
      }),
    );

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();
    throw error;
  }

  /* ---------- OUTSIDE TRANSACTION ---------- */

  // (future use: invoice, email, notification etc.)

  return {
    order: updatedOrder,
  };
};

const getSingleOrder = async (id: string) => {
  const order = await Order.findById(id)
    .populate("customer", "name email _id role phone")
    .populate("seller", "name email _id role phone")
    .populate("payment")
    .populate("products.product");
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order Not Found");
  }
  return { data: order };
};

const deleteOrder = async (id: string) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order Not Found");
  }

  await Order.findByIdAndDelete(id);
  return { data: null };
};

const updateOrderStatus = async (orderId: string, status: string) => {
  const existingOrder = await Order.findById(orderId);

  if (!existingOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  const prevStatus = existingOrder.orderStatus;

  const updateData: any = {
    orderStatus: status,
  };

  const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!updatedOrder) {
    throw new AppError(httpStatus.BAD_REQUEST, "Failed to update order status");
  }

  return updatedOrder;
};

const updateOrder = async (orderId: string, payload: any) => {
  const existingOrder = await Order.findById(orderId);

  if (!existingOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  let subtotal = 0;

  if (payload.products && payload.products.length > 0) {
    subtotal = payload.products.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    );
  }

  // const prevStatus = existingOrder.orderStatus;
  const shippingCost = payload.shippingCost ?? existingOrder.shippingCost ?? 0;
  const total = subtotal + shippingCost - payload.discount;

  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    { ...payload, total, subtotal },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!updatedOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Order update failed");
  }
  return updatedOrder;
};

const getAllOrders = async (query: Record<string, string>) => {
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

  // STATUS
  if (query.orderStatus) {
    queryObj.orderStatus = query.orderStatus;
  }

  // REMOVE SPECIAL FIELDS
  delete query["createdAt[gte]"];
  delete query["createdAt[lte]"];

  const queryBuilder = new QueryBuilder(
    Order.find({
      isDeleted: false,
      ...queryObj,
    }),
    query,
  );

  const stats = await Order.aggregate([
    {
      $match: {
        isDeleted: false,
        ...queryObj,
      },
    },
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const formattedStats = {
    total: 0,
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  stats.forEach((item) => {
    formattedStats[item._id as keyof typeof formattedStats] = item.count;
    formattedStats.total += item.count;
  });

  const ordersData = queryBuilder
    .filter()
    .search(orderSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("customer", "name email _id role phone")
    .populate("seller", "name email _id role phone")
    .populate("payment")
    .populate("products.product");

  const [data, meta] = await Promise.all([ordersData, queryBuilder.getMeta()]);
  return { data, meta, stats: formattedStats };
};

const getAllTrashOrders = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Order.find({ isDeleted: true }), query);
  const ordersData = queryBuilder
    .filter()
    .search(orderSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("customer", "name email _id role phone")
    .populate("seller", "name email _id role phone")
    .populate("payment")
    .populate("products.product");

  const [data, meta] = await Promise.all([ordersData, queryBuilder.getMeta()]);
  return { data, meta };
};

const getMyOrders = async (userId: string, query: Record<string, string>) => {
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

  if (query.orderStatus) {
    queryObj.orderStatus = query.orderStatus;
  }

  delete query["createdAt[gte]"];
  delete query["createdAt[lte]"];

  const user = await User.findById(userId).select("role email");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  let baseQuery;

  if (user.role === Role.CUSTOMER) {
    baseQuery = Order.find({
      isDeleted: false,
      "billingDetails.email": user.email,
      ...queryObj,
    });
  } else if ([Role.MODERATOR, Role.MANAGER].includes(user.role)) {
    baseQuery = Order.find({
      isDeleted: false,
      seller: userId,
      ...queryObj,
    });
  } else if (user.role === Role.ADMIN) {
    baseQuery = Order.find({
      isDeleted: false,
      ...queryObj,
    });
  } else {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(orderSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate();

  const orders = await queryBuilder
    .build()
    .populate("customer", "name email _id role phone")
    .populate("seller", "name email _id role phone")
    .populate("payment")
    .populate("products.product");

  const meta = await queryBuilder.getMeta();

  return { data: orders, meta };
};

export const OrderServices = {
  createOrder,
  getSingleOrder,
  getAllOrders,
  getAllTrashOrders,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getMyOrders,
};
