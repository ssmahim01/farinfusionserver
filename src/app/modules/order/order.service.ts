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
import { Coupon } from "../coupon/coupon.model";
import { CouponServices } from "../coupon/coupon.service";

interface TCreateOrderPayload {
  orderType: OrderType;
  paymentMethod?: PaymentMethod;
  total: number;
  discount?: number;
  couponCode?: string;
  scheduleType?: string;
  scheduledAt?: Date;
  isPublished?: boolean;
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

const publishScheduledOrders = async () => {
  const now = new Date();

  const orders = await Order.find({
    scheduleType: "SCHEDULED",
    isPublished: false,
    scheduledAt: { $lte: now },
  });

  for (const order of orders) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existing = await Order.findOne({
      "billingDetails.phone": order?.billingDetails?.phone,
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd,
      },
      isPublished: true,
      _id: { $ne: order._id },
    });

    if (!existing) {
      order.isPublished = true;
      await order.save();
    }
  }
};

const getTransactionId = () => {
  return `Tran_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

const checkCustomerOrder = async (phone: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const exists = await Order.exists({
    "billingDetails.phone": phone,
    createdAt: { $gte: todayStart, $lte: todayEnd },
    isPublished: true,
  });

  return { blocked: !!exists };
};

const createOrder = async (payload: TCreateOrderPayload) => {
  const session = await mongoose.startSession();

  let updatedOrder;

  try {
    session.startTransaction();

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

    const sanitizedProducts = payload.products.map((p: any) => {
      if (!p.product) {
        throw new AppError(400, "Invalid product");
      }

      let productId;

      if (typeof p.product === "string") {
        productId = p.product;
      } else if (p.product?._id) {
        productId = p.product._id;
      } else {
        throw new AppError(400, "Invalid product format");
      }

      return {
        product: new Types.ObjectId(productId),
        quantity: Number(p.quantity) || 1,
        selectedExtras: p.selectedExtras || [],
      };
    });

    const calculatedOrder = await calculateOrderPrice(
      sanitizedProducts as unknown as IOrderProduct[],
      payload.shippingCost || 0,
    );

    const isScheduled = payload.scheduleType === "SCHEDULED";

    const orderDoc: any = {
      customOrderId: `ORD-${customOrderId}`,
      orderType: payload.orderType,

      products: calculatedOrder.productsWithPrice.map((p: any) => {
        let productId;

        if (typeof p.product === "string") {
          productId = p.product;
        } else if (p.product?._id) {
          productId = p.product._id;
        } else {
          throw new Error("Invalid product in calculatedOrder");
        }

        return {
          product: new Types.ObjectId(productId),
          quantity: Number(p.quantity) || 1,
          price: Number(p.price) || 0,
        };
      }),

      subtotal: calculatedOrder.subtotal,
      shippingCost: calculatedOrder.shippingCost,
      total: payload?.total || calculatedOrder.totalPrice,
      discount: payload?.discount || 0,
      scheduleType: payload.scheduleType || "INSTANT",
      scheduledAt: payload.scheduledAt || null,
      isPublished: isScheduled ? false : true,

      orderStatus: OrderStatus.PENDING,
    };

    // console.log("ORDER PRODUCTS:", JSON.stringify(orderDoc.products, null, 2));

    if (payload.couponCode) {
      const coupon = await CouponServices.applyCoupon(
        payload.couponCode,
        calculatedOrder.totalPrice,
      );

      orderDoc.discount = coupon.discount;
      orderDoc.total = coupon.finalTotal;

      await Coupon.findByIdAndUpdate(coupon.couponId, {
        $inc: { usedCount: 1 },
      });
    }

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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingOrderToday = await Order.findOne({
      "billingDetails.phone": payload.billingDetails.phone,
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd,
      },
      isDeleted: false,
      isPublished: true,
    }).session(session);

    if (existingOrderToday) {
      throw new AppError(
        400,
        "This customer already placed an order today. Try again after 12 AM.",
      );
    }

    const order = new Order(orderDoc);
    await order.save({ session });

    const orderId = order?._id;

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
      sanitizedProducts.map(async (p) => {
        const product = await Product.findById(p.product).session(session);

        if (product) {
          product.totalSold = (product.totalSold || 0) + p.quantity;
          product.availableStock = (product.availableStock || 0) - p.quantity;
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

  if (order.trackingNumber) {
    try {
      await CourierServices.trackCourier(order?.trackingNumber);
    } catch (err) {
      console.log("Courier sync failed (non-blocking)");
    }
  }

  return { data: order };
};

const deleteOrder = async (id: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(id).session(session);

    if (!order) {
      throw new AppError(httpStatus.NOT_FOUND, "Order Not Found");
    }

    if (!(order as any).isRestocked) {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              availableStock: item.quantity,
              totalSold: -item.quantity,
            },
          },
          { session },
        );
      }

      (order as any).isRestocked = true;
      await order.save({ session });
    }

    await Order.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    return { data: null };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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

const exchangeOrderItem = async ({
  orderId,
  itemIndex,
  newProductId,
  note,
}: any) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(orderId)
      .populate("products.product")
      .session(session);

    if (!order) throw new AppError(404, "Order not found");

    const item = order.products[itemIndex];
    if (!item) throw new AppError(400, "Invalid item");

    const oldProduct = await Product.findById(item.product).session(session);
    const newProduct = await Product.findById(newProductId).session(session);

    if (!oldProduct) throw new AppError(404, "Old product not found");
    if (!newProduct) throw new AppError(404, "New product not found");

    const qty = item.quantity;

    // Restore old product stock
    await Product.findByIdAndUpdate(
      oldProduct._id,
      {
        $inc: {
          availableStock: qty,
          totalSold: -qty,
        },
      },
      { session },
    );

    // Deduct new product stock
    await Product.findByIdAndUpdate(
      newProduct._id,
      {
        $inc: {
          availableStock: -qty,
          totalSold: qty,
        },
      },
      { session },
    );

    // price difference
    const priceDiff = (newProduct.price - item.price) * qty;

    // update order item
    item.product = newProduct._id;
    item.price = newProduct.price;

    // history save
    if (order) {
      if (!order.exchangeHistory) {
        order.exchangeHistory = [];
      }
      order.exchangeHistory.push({
        product: oldProduct?._id,
        newProduct: newProduct._id,
        quantity: qty,
        priceDiff,
        note,
      });
    }

    // update total
    order.total += priceDiff;

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const markOrderDamage = async ({
  orderId,
  itemIndex,
  quantity,
  note,
}: any) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(orderId)
      .populate("products.product")
      .session(session);

    if (!order) throw new AppError(404, "Order not found");

    const item = order.products[itemIndex];
    if (!item) throw new AppError(400, "Invalid item");

    if (quantity > item.quantity) {
      throw new AppError(400, "Invalid damage quantity");
    }

    const product = await Product.findById(item.product).session(session);

    if (!product) throw new AppError(404, "Product not found");


    order?.damageProducts?.push({
      product: product?._id,
      quantity,
      note,
    });

    order.total -= item.price * quantity;

    order.orderStatus = OrderStatus.DAMAGE;

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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

const assignSeller = async (orderId: string, sellerId: string) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new AppError(404, "Seller not found");
  }

  if (!["ADMIN", "MANAGER", "MODERATOR", "TELLICELSS"].includes(seller.role)) {
    throw new AppError(400, "Invalid seller role");
  }

  order.seller = new Types.ObjectId(sellerId);

  await order.save();

  return await order.populate([
    { path: "seller", select: "name email role" },
    { path: "customer", select: "name email" },
  ]);
};

const getAllOrders = async (query: Record<string, string>) => {
  await publishScheduledOrders();
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
      isPublished: true,
      ...queryObj,
    }),
    query,
  );

  const stats = await Order.aggregate([
    {
      $match: {
        isDeleted: false,
        isPublished: true,
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
    .search(orderSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("customer", "name email _id role phone")
    .populate("seller", "name email _id role phone")
    .populate("payment")
    .populate("products.product");

  const [data, meta] = await Promise.all([ordersData, queryBuilder.getMeta()]);
  await Promise.all(
    data.map(async (order: any) => {
      if (order.trackingNumber) {
        try {
          await CourierServices.trackCourier(order.trackingNumber);
        } catch {}
      }
    }),
  );
  return { data, meta, stats: formattedStats };
};

const getAllScheduledOrders = async (query: Record<string, string>) => {
  const queryObj: any = {
    isDeleted: false,
    isPublished: false,
    scheduleType: "SCHEDULED",
  };

  // DATE FILTER (optional)
  if (query["scheduledAt[gte]"] || query["scheduledAt[lte]"]) {
    queryObj.scheduledAt = {};

    if (query["scheduledAt[gte]"]) {
      queryObj.scheduledAt.$gte = new Date(query["scheduledAt[gte]"]);
    }

    if (query["scheduledAt[lte]"]) {
      queryObj.scheduledAt.$lte = new Date(query["scheduledAt[lte]"]);
    }
  }

  const queryBuilder = new QueryBuilder(Order.find(queryObj), query);

  const data = await queryBuilder
    .search(orderSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("customer", "name email phone")
    .populate("seller", "name email role")
    .populate("products.product");

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

  const meta = await queryBuilder.getMeta();

  return { data, meta, stats: formattedStats };
};

const getMyScheduledOrders = async (
  userId: string,
  query: Record<string, string>,
) => {
  const user = await User.findById(userId).select("role email");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let baseQuery: any = {
    isDeleted: false,
    isPublished: false,
    scheduleType: "SCHEDULED",
  };

  if (user.role === Role.CUSTOMER) {
    baseQuery["billingDetails.email"] = user.email;
  } else if (
    [Role.MODERATOR, Role.MANAGER, Role.TELLICELSS].includes(user.role)
  ) {
    baseQuery.seller = userId;
  } else if (user.role === Role.ADMIN) {
    baseQuery.seller = userId;
  }

  const queryBuilder = new QueryBuilder(Order.find(baseQuery), query);

  const data = await queryBuilder
    .search(orderSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("customer", "name email phone")
    .populate("seller", "name email role")
    .populate("products.product");

  const meta = await queryBuilder.getMeta();

  return { data, meta };
};

const getAllTrashOrders = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    Order.find({ isDeleted: true, isPublished: true }),
    query,
  );
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
  await publishScheduledOrders();
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
      isPublished: true,
      "billingDetails.email": user.email,
      ...queryObj,
    });
  } else if (
    [Role.MODERATOR, Role.MANAGER, Role.TELLICELSS].includes(user.role)
  ) {
    baseQuery = Order.find({
      isDeleted: false,
      isPublished: true,
      seller: userId,
      ...queryObj,
    });
  } else if (user.role === Role.ADMIN) {
    baseQuery = Order.find({
      isDeleted: false,
      isPublished: true,
      seller: userId,
      ...queryObj,
    });
  } else {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  const statsAgg = await Order.aggregate([
    {
      $match: {
        isDeleted: false,
        isPublished: true,

        ...(user.role === Role.CUSTOMER
          ? { "billingDetails.email": user.email }
          : { seller: new Types.ObjectId(userId) }),

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

  const stats = {
    total: 0,
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  statsAgg.forEach((item) => {
    stats[item._id as keyof typeof stats] = item.count;
    stats.total += item.count;
  });

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

  return { data: orders, meta, stats };
};

export const OrderServices = {
  createOrder,
  getSingleOrder,
  getAllOrders,
  getAllTrashOrders,
  updateOrder,
  checkCustomerOrder,
  updateOrderStatus,
  assignSeller,
  deleteOrder,
  getAllScheduledOrders,
  exchangeOrderItem,
  markOrderDamage,
  getMyScheduledOrders,
  getMyOrders,
};
