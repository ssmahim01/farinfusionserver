/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { Courier } from "./courier.model";
import {
  CourierDeliveryStatus,
  CourierName,
  CourierStatus,
} from "./courier.interface";
import { Order } from "../order/order.model";
import { DeliveryStatus, OrderStatus } from "../order/order.interface";
import { Product } from "../product/product.model";

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

const trackCourier = async (trackingCode: string) => {
  const courier = await Courier.findOne({ trackingCode });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier not found");
  }

  const res = await axios.get(
    `${BASE_URL}/status_by_trackingcode/${trackingCode}`,
    { headers },
  );

  // console.log("TRACK RESPONSE:", res.data);

  const apiStatus = res.data?.delivery_status || res.data?.status;

  if (!apiStatus) {
    throw new AppError(400, "Invalid tracking response");
  }

  let mappedStatus = CourierDeliveryStatus.IN_TRANSIT;

  if (apiStatus === "delivered") {
    mappedStatus = CourierDeliveryStatus.DELIVERED;
  } else if (apiStatus === "cancelled") {
    mappedStatus = CourierDeliveryStatus.CANCELLED;
  }

  if (courier?.deliveryStatus !== mappedStatus) {
    courier.deliveryStatus = mappedStatus;
    courier.rawResponse = res.data;
    await courier.save();

    if (mappedStatus === CourierDeliveryStatus.DELIVERED) {
      await Order.findByIdAndUpdate(courier.order, {
        deliveryStatus: "DELIVERED",
        orderStatus: "COMPLETED",
      });
    }
    if (mappedStatus === CourierDeliveryStatus.CANCELLED) {
      const order = await Order.findById(courier.order).populate(
        "products.product",
      );

      if (order) {
        if (!(order as any).isRestocked) {
          for (const item of order.products) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: {
                availableStock: item.quantity,
                totalSold: -item.quantity,
              },
            });
          }

          (order as any).isRestocked = true;
        }

        order.deliveryStatus = DeliveryStatus.CANCELLED;
        order.orderStatus = OrderStatus.CANCELLED;

        await order.save();
      }
    }
  }

  return courier;
};

const createCourier = async (orderId: string) => {
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
    const res = await axios.post(`${BASE_URL}/create_order`, payload, {
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
      error?.response?.data?.message || "Courier creation failed",
    );
  }
};

export const CourierServices = {
  createCourier,
  trackCourier,
};
