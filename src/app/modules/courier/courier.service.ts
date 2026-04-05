/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { Courier } from "./courier.model";
import { CourierName, CourierStatus } from "./courier.interface";
import { Order } from "../order/order.model";
import { DeliveryStatus } from "../order/order.interface";

const BASE_URL = "https://portal.packzy.com/api/v1";

const headers = {
  "Api-Key": process.env.STEADFAST_API_KEY,
  "Secret-Key": process.env.STEADFAST_SECRET_KEY,
  "Content-Type": "application/json",
};

const mapOrderToSteadfast = (order: any) => ({
  invoice: order.customOrderId,
  recipient_name: order.billingDetails?.fullName,
  recipient_phone: order.billingDetails?.phone,
  recipient_address: order.billingDetails?.address,
  cod_amount: order.total,
  note: order?.note || "Auto generated order",
 item_description: order.products
  ?.map((p: any) => {
    const name = p.product?.title || "Unknown Product";
    return `${name} x${p.quantity}`;
  })
  .join(", "),
  delivery_type: 0,
});

const createCourier = async (orderId: string) => {
  const order = await Order.findById({_id: orderId}).populate("products.product");

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }
  const existing = await Courier.findOne({ order: orderId });
  if (existing) return existing;

  const payload = mapOrderToSteadfast(order);

  try {
    const res = await axios.post(
      `${BASE_URL}/create_order`,
      payload,
      { headers }
    );

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
    order.deliveryStatus = DeliveryStatus.IN_TRANSIT;

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
      error?.response?.data?.message || "Courier creation failed"
    );
  }
};

const trackCourier = async (trackingCode: string) => {
  const res = await axios.get(
    `${BASE_URL}/status_by_trackingcode/${trackingCode}`,
    { headers }
  );

  return res.data;
};

export const CourierServices = {
  createCourier,
  trackCourier,
};