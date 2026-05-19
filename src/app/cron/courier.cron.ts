import cron from "node-cron";
import { CourierSyncService } from "../modules/courier/courier.sync.service";

export const startCourierCron = () => {
  cron.schedule(
    "*/5 * * * *",
    async () => {
      console.log("🔄 Running courier sync cron...");

      try {
        await CourierSyncService.syncActiveCouriers();
      } catch (err) {
        console.error("❌ Courier cron failed:", err);
      }
    },
    {
      timezone: "Asia/Dhaka",
    },
  );
};