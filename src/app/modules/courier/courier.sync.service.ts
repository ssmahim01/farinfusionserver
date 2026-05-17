import { Courier } from "./courier.model";
import { CourierDeliveryStatus, CourierName } from "./courier.interface";
import { CourierServices } from "./courier.service";

const syncSteadfastCouriers = async () => {
  const activeCouriers = await Courier.find({
    courierName: CourierName.STEADFAST,
    trackingCode: { $exists: true, $ne: null },
    deliveryStatus: {
      $nin: [CourierDeliveryStatus.DELIVERED, CourierDeliveryStatus.CANCELLED],
    },
  })
    .limit(100)
    .select("trackingCode");

  console.log(`Syncing ${activeCouriers.length} active Steadfast couriers...`);

  for (const courier of activeCouriers) {
    try {
      const trackingCode = courier?.trackingCode || "No tracking code";
      await CourierServices.trackCourier(trackingCode);
    } catch (err) {
      console.error(`Failed syncing tracking: ${courier.trackingCode}`);
    }
  }
};

export const CourierSyncService = {
  syncSteadfastCouriers,
};
