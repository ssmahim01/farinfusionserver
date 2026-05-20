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

const BASE_URL = process.env.PAPERFLY_BASE_URL!;

const auth = {
  username: process.env.PAPERFLY_USERNAME!,
  password: process.env.PAPERFLY_PASSWORD!,
};

const headers = {
  paperflykey: process.env.PAPERFLY_API_KEY!,
  "Content-Type": "application/json",
};

const MAX_PRODUCT_BRIEF_LENGTH = 200;

const buildProductDescription = (products: any[], maxLength: number) => {
  let parts = products.map((p: any) => ({
    name: p.product?.title || "Item",
    qty: p.quantity || 1,
  }));

  const buildText = (items: any[]) =>
    items.map((p) => `${p.name} x${p.qty}`).join(", ");

  let description = buildText(parts);

  if (description.length <= maxLength) {
    return description;
  }

  const totalNamesLength = parts.reduce(
    (sum: number, p: any) => sum + p.name.length,
    0,
  );

  const reservedLength = parts.length * 6;
  const availableForNames = maxLength - reservedLength;

  const shrinkRatio = availableForNames / totalNamesLength;
  const minLength = 5;

  parts = parts.map((p: any) => {
    let newLen = Math.floor(p.name.length * shrinkRatio);

    if (newLen < minLength) {
      newLen = minLength;
    }

    if (newLen < p.name.length) {
      return {
        ...p,
        name: p.name.slice(0, newLen - 3) + "...",
      };
    }

    return p;
  });

  description = buildText(parts);

  if (description.length > maxLength) {
    description = description.slice(0, maxLength - 3) + "...";
  }

  return description;
};

const mapPaperflyStatus = (statusObj: any): CourierDeliveryStatus => {
  if (!statusObj) {
    return CourierDeliveryStatus.PENDING;
  }

  if (statusObj.Delivered) {
    return CourierDeliveryStatus.DELIVERED;
  }

  if (statusObj.Partial) {
    return CourierDeliveryStatus.PARTIAL;
  }

  if (statusObj.Returned || statusObj.close) {
    return CourierDeliveryStatus.CANCELLED;
  }

  if (statusObj.onHoldSchedule) {
    return CourierDeliveryStatus.HOLD;
  }

  if (statusObj.PickedForDelivery) {
    return CourierDeliveryStatus.PICKED_UP;
  }

  if (statusObj.inTransit || statusObj.ReceivedAtPoint || statusObj.Pick) {
    return CourierDeliveryStatus.IN_TRANSIT;
  }

  return CourierDeliveryStatus.PENDING;
};

const mapOrderToPaperfly = (order: any) => {
  const products = order.products || [];

  const productBrief = buildProductDescription(
    products,
    MAX_PRODUCT_BRIEF_LENGTH,
  );

  return {
    merchantOrderReference: order.customOrderId,
    storeName: "Farin Fusion",
    productBrief: productBrief || "Customer Order",
    packagePrice: order.total,
    max_weight: "1",
    customerName: order.billingDetails?.fullName,
    customerAddress: order.billingDetails?.address,
    customerPhone: order.billingDetails?.phone,
  };
};

const createCourier = async (orderId: string) => {
  const order = await Order.findById(orderId).populate("products.product");

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  const payload = mapOrderToPaperfly(order);

  try {
    const res = await axios.post(
      `${BASE_URL}/merchant/api/service/new_order_v2.php`,
      payload,
      {
        auth,
        headers,
      },
    );

    const success = res.data?.success;
    // console.log("Paperfly create response:", res.data);

    const courier = await Courier.create({
      order: order._id,
      courierName: CourierName.PAPERFLY,
      trackingCode: success?.tracking_number,
      consignmentId: success?.tracking_barcode,
      trackingBarcode: success?.tracking_barcode,
      merchantOrderReference: String(order?.customOrderId),
      status: CourierStatus.CREATED,
      rawResponse: res.data,
    });

    order.courierName = CourierName.PAPERFLY;
    order.trackingNumber = success?.tracking_number;
    order.deliveryStatus = DeliveryStatus.COURIERASSIGNED;

    await order.save();

    return courier;
  } catch (error: any) {
    console.log("Paperfly courier creation failed:", error?.response?.data);

    throw new AppError(
      httpStatus.BAD_REQUEST,
      error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Paperfly courier creation failed",
    );
  }
};

const trackCourier = async (trackingCode: string) => {
  const courier = await Courier.findOne({
    trackingCode,
    courierName: CourierName.PAPERFLY,
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Paperfly courier not found");
  }

  const referenceNumber =
    courier.merchantOrderReference || courier.trackingCode;

  try {
    const res = await axios.post(
      `${BASE_URL}/API-Order-Tracking`,
      {
        ReferenceNumber: referenceNumber,
      },
      {
        auth,
        headers,
        timeout: 15000,
      },
    );

    const tracking = res.data?.success?.trackingStatus?.[0];

    if (!tracking) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid Paperfly tracking response",
      );
    }

    const mappedStatus = mapPaperflyStatus(tracking);

    if (courier.deliveryStatus === mappedStatus) {
      return courier;
    }

    courier.deliveryStatus = mappedStatus;
    courier.rawResponse = res.data;

    await courier.save();

    await syncCourierOrderStatus(courier, mappedStatus);

    return courier;
  } catch (error: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Paperfly tracking failed",
    );
  }
};

export const PaperflyProvider = {
  createCourier,
  trackCourier,
};
