/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import httpStatus from "http-status-codes";
import AppError from "../../../errorHelpers/appError";
import { Courier } from "../courier.model";
import {
  CourierDeliveryStatus,
  CourierName,
  CourierStatus,
} from "../courier.interface";
import { Order } from "../../order/order.model";
import { DeliveryStatus, OrderStatus } from "../../order/order.interface";
import { Product } from "../../product/product.model";

const BASE_URL = process.env.PATHAO_BASE_URL;

let cachedToken: string | null = null;
let tokenExpireTime: number | null = null;

const getPathaoToken = async () => {
  if (cachedToken && tokenExpireTime && Date.now() < tokenExpireTime) {
    return cachedToken;
  }

  try {
    const res = await axios.post(`${BASE_URL}/aladdin/api/v1/issue-token`, {
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
      grant_type: "password",
    });

    cachedToken = res.data?.access_token;

    tokenExpireTime = Date.now() + (res.data?.expires_in || 3600) * 1000;

    return cachedToken;
  } catch (error: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      error?.response?.data?.message || "Failed to authenticate Pathao",
    );
  }
};

const getHeaders = async () => {
  const token = await getPathaoToken();

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
};

const mapOrderToPathao = (order: any) => {
  return {
    store_id: Number(process.env.PATHAO_STORE_ID),

    merchant_order_id: order.customOrderId,

    recipient_name: order.billingDetails?.fullName || "Customer",

    recipient_phone: order.billingDetails?.phone || "",

    recipient_address: order.billingDetails?.address || "",

    recipient_city: 1,
    recipient_zone: 1,
    recipient_area: 1,

    delivery_type: 48,

    item_type: 2,

    special_instruction: order.note || "Auto generated order",

    item_quantity: order.products?.length || 1,

    item_weight: 0.5,

    amount_to_collect: order.total,
  };
};

const createCourier = async (order: any) => {
  const existing = await Courier.findOne({
    order: order._id,
    status: { $ne: CourierStatus.CANCELLED },
  });

  if (existing) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Courier already created for this order",
    );
  }

  try {
    const headers = await getHeaders();

    const payload = mapOrderToPathao(order);

    const res = await axios.post(`${BASE_URL}/aladdin/api/v1/orders`, payload, {
      headers,
    });

    const data = res.data?.data;

    const courier = await Courier.create({
      order: order._id,
      courierName: CourierName.PATHAO,
      consignmentId: data?.consignment_id,
      trackingCode: data?.tracking_number,
      status: CourierStatus.CREATED,
      rawResponse: res.data,
    });

    order.courierName = CourierName.PATHAO;
    order.trackingNumber = data?.tracking_number;
    order.deliveryStatus = DeliveryStatus.IN_TRANSIT;

    await order.save();

    return courier;
  } catch (error: any) {
    await Courier.create({
      order: order._id,
      courierName: CourierName.PATHAO,
      status: CourierStatus.FAILED,
      rawResponse: error?.response?.data,
    });

    throw new AppError(
      httpStatus.BAD_REQUEST,
      error?.response?.data?.message || "Pathao courier creation failed",
    );
  }
};

const trackCourier = async (trackingCode: string) => {
  const courier = await Courier.findOne({
    trackingCode,
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier not found");
  }

  const headers = await getHeaders();

  const res = await axios.get(
    `${BASE_URL}/aladdin/api/v1/orders/${trackingCode}/info`,
    { headers },
  );

  const pathaoStatus = res.data?.data?.order_status?.toLowerCase();

  let mappedStatus = CourierDeliveryStatus.IN_TRANSIT;

  switch (pathaoStatus) {
    case "pending":
      mappedStatus = CourierDeliveryStatus.PENDING;
      break;

    case "picked_up":
      mappedStatus = CourierDeliveryStatus.PICKED_UP;
      break;

    case "delivered":
      mappedStatus = CourierDeliveryStatus.DELIVERED;
      break;

    case "partial_delivered":
      mappedStatus = CourierDeliveryStatus.PARTIAL;
      break;

    case "cancelled":
      mappedStatus = CourierDeliveryStatus.CANCELLED;
      break;

    case "on_hold":
      mappedStatus = CourierDeliveryStatus.HOLD;
      break;

    default:
      mappedStatus = CourierDeliveryStatus.IN_TRANSIT;
  }

  if (courier.deliveryStatus !== mappedStatus) {
    courier.deliveryStatus = mappedStatus;
    courier.rawResponse = res.data;

    await courier.save();

    const orderUpdate: any = {
      deliveryStatus: mappedStatus,
    };

    switch (mappedStatus) {
      case CourierDeliveryStatus.DELIVERED:
        orderUpdate.orderStatus = OrderStatus.COMPLETED;
        break;

      case CourierDeliveryStatus.CANCELLED:
        orderUpdate.orderStatus = OrderStatus.CANCELLED;
        break;

      case CourierDeliveryStatus.PARTIAL:
        orderUpdate.orderStatus = OrderStatus.PARTIAL;
        break;

      default:
        orderUpdate.orderStatus = OrderStatus.CONFIRMED;
    }

    await Order.findByIdAndUpdate(courier.order, orderUpdate);

    if (mappedStatus === CourierDeliveryStatus.CANCELLED) {
      const order = await Order.findById(courier.order).populate(
        "products.product",
      );

      if (order && !(order as any).isRestocked) {
        for (const item of order.products) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: {
              availableStock: item.quantity,
              totalSold: -item.quantity,
            },
          });
        }

        (order as any).isRestocked = true;

        await order.save();
      }
    }
  }

  return courier;
};

export const PathaoProvider = {
  createCourier,
  trackCourier,
};
