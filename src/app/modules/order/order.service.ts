/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from "http-status-codes"
import mongoose, { Types } from "mongoose";
import {
  IOrderProduct,
  OrderStatus,
  OrderType,
} from "./order.interface";
import { Counter, Order } from "./order.model";
import { calculateOrderPrice } from "../../utils/calculateOrderTotal";
import { Payment } from "../payment/payment.model";
import {
  PaymentMethod,
  PaymentStatus,
} from "../payment/payment.interface";
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
  products: IOrderProduct[];
  shippingCost?: number;


  billingDetails: {
    fullName?: string;
    email: string;
    phone?: string;
    address?: string;
  };
  user?: string;
  seller?: string;
};

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
      session: mongoose.ClientSession
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
      payload.shippingCost || 0
    );

    /* ---------- ORDER DOC ---------- */

    const orderDoc: any = {
      customOrderId: `ORD-${customOrderId}`, // ✅ nice format
      orderType: payload.orderType,

      products: calculatedOrder.productsWithPrice,

      subtotal: calculatedOrder.subtotal,
      shippingCost: calculatedOrder.shippingCost,
      total: calculatedOrder.totalPrice,

      orderStatus: OrderStatus.PENDING,
    };

    /* ---------- USER (OPTIONAL) ---------- */

    const isUserExist = await User.findOne({ email: payload?.billingDetails?.email }).session(session);;

    if (isUserExist) {
      orderDoc.customer = isUserExist?._id;
    }


    /* ---------- BILLING DETAILS ---------- */

    if (payload.billingDetails) {
      orderDoc.billingDetails = payload.billingDetails;
    }

    /* ---------- POS ORDER ---------- */

    if (payload.orderType === OrderType.POS) {
      orderDoc.seller = payload.seller;
    }

    /* ---------- CREATE ORDER ---------- */

    const [order] = await Order.create([orderDoc], { session });
    const orderId = order._id;

    /* ---------- CREATE PAYMENT ---------- */

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
      { session }
    );

    /* ---------- UPDATE ORDER WITH PAYMENT ---------- */

    updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        payment: payment._id,
        transactionId,

        orderStatus:
          payload.paymentMethod === PaymentMethod.COD
            ? OrderStatus.CONFIRMED
            : OrderStatus.PENDING,
      },
      { returnDocument: "after", session }
    )
      .populate("customer", "name email _id role phone")
      .populate("seller", "name email _id role phone")
      .populate("products.product");

    /* ---------- UPDATE PRODUCT SALES ---------- */

    await Promise.all(
      payload.products.map(async (p) => {
        const product = await Product.findById(p.product).session(session);

        if (product) {
          product.totalSold = (product.totalSold || 0) + p.quantity;
            product.availableStock = (product.availableStock ?? 0) - p.quantity;
          await product.save({ session });
        }
      })
    );

    /* ---------- COMMIT ---------- */

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
  const order = await Order.findById(id).populate("customer", "name email _id role phone")
    .populate("seller", "name email _id role phone").
    populate("payment").
    populate("products.product");
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

const updateOrder = async (orderId: string, payload: any) => {
  const existingOrder = await Order.findById(orderId);

  if (!existingOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  const prevStatus = existingOrder.orderStatus;

  const updatedOrder = await Order.findByIdAndUpdate(orderId, payload, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!updatedOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Order update failed");
  }

  if (
    prevStatus !== OrderStatus.CONFIRMED &&
    updatedOrder.orderStatus === OrderStatus.CONFIRMED
  ) {
    await CourierServices.createCourier(orderId);
  }

  return updatedOrder;
};

const getAllOrders = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Order.find({ isDeleted: false }), query);
  const ordersData = queryBuilder.filter().search(orderSearchableFields).sort().fields().paginate().build()
    .populate("customer", "name email _id role phone")
    .populate("seller", "name email _id role phone")
    .populate("payment")
    .populate("products.product");;

  const [data, meta] = await Promise.all([
    ordersData,
    queryBuilder.getMeta(),
  ]);
  return { data, meta };
};

const getAllTrashOrders = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Order.find({ isDeleted: true }), query);
  const ordersData = queryBuilder.filter().search(orderSearchableFields).sort().fields().paginate().build()
    .populate("customer", "name email _id role phone")
    .populate("seller", "name email _id role phone")
    .populate("payment")
    .populate("products.product");;

  const [data, meta] = await Promise.all([
    ordersData,
    queryBuilder.getMeta(),
  ]);
  return { data, meta };
};

const getMyOrders = async (userId: string, query: Record<string, string>) => {
  let userObjectId: Types.ObjectId;

  try {
    userObjectId = new Types.ObjectId(userId);
  } catch (err) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid user ID");
  }

  // 1️⃣ Fetch user role
  const user = await User.findById(userId).select("role email");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  // 2️⃣ Build base query conditionally
  let baseQuery;
  if (user.role === Role.CUSTOMER) {
    // Customer → search by email
    baseQuery = Order.find({ "billingDetails.email": user.email });
  } else if ([Role.MODERATOR, Role.MANAGER, Role.ADMIN].includes(user.role)) {
    // Seller/Admin/Moderator → search by seller field
    baseQuery = Order.find({ seller: userObjectId });
  } else {
    throw new AppError(httpStatus.FORBIDDEN, "Invalid role for order access");
  }

  // 3️⃣ Initialize query builder
  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(orderSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate();

  // 4️⃣ Execute query + populate
  const orders = await queryBuilder
    .build()
    .populate({
      path: "payment",
      select: "paymentMethod transactionId amount paymentStatus createdAt",
    })
    .populate({
      path: "products.product",
      select: "name price image description",
    })
    .populate({
      path: "customer",
      select: "name email _id role phone",
    })
    .populate({
      path: "seller",
      select: "name email _id role phone",
    })
    .exec();

  const meta = await queryBuilder.getMeta();

  return {
    data: orders,
    meta,
  };
};


export const OrderServices = {
  createOrder,
  getSingleOrder,
  getAllOrders,
  getAllTrashOrders,
  updateOrder,
  deleteOrder,
  getMyOrders
};