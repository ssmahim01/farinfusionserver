import axios from "axios";
import { Courier } from "../../modules/courier/courier.model";
import { Order } from "../../modules/order/order.model";
import cron from "node-cron";
import { CourierDeliveryStatus } from "../../modules/courier/courier.interface";

cron.schedule("*/5 * * * *", async () => {
  console.log("🔄 Checking courier status...");

  const couriers = await Courier.find({
    deliveryStatus: { $ne: "DELIVERED" },
  });

  for (const courier of couriers) {
    try {
      const res = await axios.get(
        `https://steadfast.api/track/${courier.trackingCode}`,
        {
          headers: {
            "api-key": process.env.STEADFAST_API_KEY,
          },
        }
      );

      console.log("API RESPONSE:", res.data);

      const status = res.data?.data?.status;
      const normalizedStatus = status?.toUpperCase();

      if (normalizedStatus === "DELIVERED") {
        courier.deliveryStatus = CourierDeliveryStatus.DELIVERED;
        await courier.save();

        await Order.findByIdAndUpdate(courier.order, {
          deliveryStatus: "DELIVERED",
          orderStatus: "COMPLETED",
        });

        console.log(`✅ Delivered: ${courier.trackingCode}`);
      }
    } catch (error: any) {
      console.error("❌ Error:", error.message);
    }
  }
});