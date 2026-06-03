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
import { DeliveryStatus } from "../../order/order.interface";
import { syncCourierOrderStatus } from "../courier.service";
import { CourierSettings } from "../../courierSettings/courierSettings.model";

// const BASE_URL = "https://portal.packzy.com/api/v1";

// const headers = {
//   "Api-Key": process.env.STEADFAST_API_KEY,
//   "Secret-Key": process.env.STEADFAST_SECRET_KEY,
//   "Content-Type": "application/json",
// };

const getSteadfastConfig = async () => {
  const settings: any = await CourierSettings.findOne({
    provider: CourierName.STEADFAST,
    isActive: true,
    isDeleted: false,
  });

  if (!settings) {
    throw new AppError(httpStatus.NOT_FOUND, "Steadfast settings not found");
  }

  const apiKey = String(settings.config.get("apiKey") || "").trim();
  const secretKey = String(settings.config.get("secretKey") || "").trim();
  const baseUrl = String(
    settings.config.get("baseUrl") || "https://portal.packzy.com/api/v1",
  ).trim();

  if (!apiKey || !secretKey) {
    throw new AppError(httpStatus.BAD_REQUEST, "Steadfast credentials missing");
  }

  return {
    baseUrl,
    headers: {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
    },
  };
};

const MAX_DESC_LENGTH = 500;

const mapSteadfastStatus = (apiStatus: string): CourierDeliveryStatus => {
  switch (apiStatus?.toLowerCase()) {
    case "pending":
      return CourierDeliveryStatus.PENDING;

    case "picked_up":
      return CourierDeliveryStatus.PICKED_UP;

    case "in_review":
      return CourierDeliveryStatus.IN_REVIEW;

    case "partial_delivered":
      return CourierDeliveryStatus.PARTIAL;

    case "delivered":
      return CourierDeliveryStatus.DELIVERED;

    case "cancelled":
      return CourierDeliveryStatus.CANCELLED;

    case "hold":
      return CourierDeliveryStatus.HOLD;

    case "transit":
    case "in_transit":
    default:
      return CourierDeliveryStatus.IN_TRANSIT;
  }
};

const mapOrderToSteadfast = (order: any) => {
  const products = order.products || [];

  let parts = products.map((p: any) => {
    const name = p.product?.title || "Item";
    return { name, qty: p.quantity };
  });

  const buildDescription = (items: any[]) =>
    items.map((p) => `${p.name} x${p.qty}`).join(", ");

  let description = buildDescription(parts);

  if (description.length <= MAX_DESC_LENGTH) {
    return {
      invoice: order.customOrderId,
      recipient_name: order.billingDetails?.fullName,
      recipient_phone: order.billingDetails?.phone,
      recipient_address: order.billingDetails?.address,
      cod_amount: order.total,
      note: order?.note || "Auto generated order",
      item_description: description,
      delivery_type: 0,
    };
  }

  let totalNamesLength = parts.reduce(
    (sum: number, p: any) => sum + p.name.length,
    0,
  );

  const reservedLength = parts.length * 6;
  const availableForNames = MAX_DESC_LENGTH - reservedLength;

  const shrinkRatio = availableForNames / totalNamesLength;

  const minLength = 5;

  parts = parts.map((p: any) => {
    let newLen = Math.floor(p.name.length * shrinkRatio);

    if (newLen < minLength) newLen = minLength;

    if (newLen < p.name.length) {
      return {
        ...p,
        name: p.name.slice(0, newLen - 3) + "...",
      };
    }

    return p;
  });

  description = buildDescription(parts);

  if (description.length > MAX_DESC_LENGTH) {
    description = description.slice(0, MAX_DESC_LENGTH - 3) + "...";
  }

  return {
    invoice: order.customOrderId,
    recipient_name: order.billingDetails?.fullName,
    recipient_phone: order.billingDetails?.phone,
    recipient_address: order.billingDetails?.address,
    cod_amount: order.total,
    note: order?.note || "Auto generated order",
    item_description: description,
    delivery_type: 0,
  };
};

const trackCourier = async (trackingCode: string) => {
  const { baseUrl, headers } = await getSteadfastConfig();
  const courier = await Courier.findOne({
    trackingCode,
    courierName: CourierName.STEADFAST,
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Steadfast courier not found");
  }

  try {
    const res = await axios.get(
      `${baseUrl}/status_by_trackingcode/${trackingCode}`,
      {
        headers,
        timeout: 15000,
      },
    );

    const apiStatus =
      res.data?.delivery_status || res.data?.status || res.data?.data?.status;

    if (!apiStatus) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid Steadfast tracking response",
      );
    }

    const mappedStatus = mapSteadfastStatus(apiStatus);

    if (courier.deliveryStatus === mappedStatus) {
      return courier;
    }

    const collectedAmount = Number(
      res.data?.cod_amount ||
        res.data?.consignment?.cod_amount ||
        res.data?.data?.cod_amount ||
        0,
    );

    courier.deliveryStatus = mappedStatus;
    courier.rawResponse = res.data;

    await courier.save();

    await syncCourierOrderStatus(courier, mappedStatus, collectedAmount);

    return courier;
  } catch (error: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      error?.response?.data?.message || "Steadfast tracking failed",
    );
  }
};

const createCourier = async (orderId: string) => {
  const { baseUrl, headers } = await getSteadfastConfig();
  const order = await Order.findById({ _id: orderId }).populate(
    "products.product",
  );

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }
  const existing = await Courier.findOne({ order: orderId });

  // if (existing) {
  //   existing.status = CourierStatus.CANCELLED; // mark old one
  //   await existing.save();
  // }

  const payload = mapOrderToSteadfast(order);

  try {
    const res = await axios.post(`${baseUrl}/create_order`, payload, {
      headers,
    });

    const consignment = res.data?.consignment;

    const courier = await Courier.create({
      order: order._id,
      courierName: CourierName.STEADFAST,
      consignmentId: consignment?.consignment_id,
      trackingCode: consignment?.tracking_code,
      status: CourierStatus.CREATED,
      rawResponse: res.data,
    });

    order.courierName = "STEADFAST";
    order.trackingNumber = consignment?.tracking_code;
    order.deliveryStatus = DeliveryStatus.COURIERASSIGNED;
    if (!order.courierAssignedAt) {
      order.courierAssignedAt = new Date();
    }

    await order.save();

    return courier;
  } catch (error: any) {
    await Courier.create({
      order: order._id,
      courierName: CourierName.STEADFAST,
      status: CourierStatus.FAILED,
      rawResponse: error?.response?.data,
    });

    throw new AppError(
      httpStatus.BAD_REQUEST,
      error?.response?.data?.message || "Courier creation failed",
    );
  }
};

export const SteadfastProvider = {
  createCourier,
  trackCourier,
};
