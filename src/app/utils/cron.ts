import axios from "axios";
import { Courier } from "../modules/courier/courier.model";
import { Order } from "../modules/order/order.model";
import cron from "node-cron";
import { CourierDeliveryStatus } from "../modules/courier/courier.interface";

cron.schedule("*/10 * * * *", async () => {
  const couriers = await Courier.find({ deliveryStatus: { $ne: "DELIVERED" } });

  for (const courier of couriers) {
    const res = await axios.get(
      `https://steadfast.api/track/${courier.trackingCode}`
    );

    const status = res.data.status;

    if (status === "DELIVERED") {
      courier.deliveryStatus = CourierDeliveryStatus.DELIVERED;
      await courier.save();

      await Order.findByIdAndUpdate(courier.order, {
        deliveryStatus: "DELIVERED",
        orderStatus: "COMPLETED",
      });
    }
  }
});