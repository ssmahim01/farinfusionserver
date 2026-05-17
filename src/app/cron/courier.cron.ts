import cron from "node-cron";
import { CourierSyncService } from "../modules/courier/courier.sync.service";

export const startCourierCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    console.log("Running Steadfast courier sync...");

    try {
      await CourierSyncService.syncSteadfastCouriers();
    } catch (err) {
      console.error("Courier cron failed:", err);
    }
  });
};