import "dotenv/config";

import app from "./app";
import connectDatabase from "./config/database";
import { startReminderScheduler } from "./services/reminder.service";
import { ensureProductColorIds } from "./services/product-migration.service";

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  try {
    console.log("🚀 Backend starting...");

    await connectDatabase();

    const migratedProducts = await ensureProductColorIds();
    if (migratedProducts > 0) {
      console.log(`✅ Added stable color IDs to ${migratedProducts} product(s).`);
    }

    startReminderScheduler();

    app.listen(PORT, () => {
      console.log(
        `✅ HivraSoft backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Server startup failed:");
    console.error(error);

    process.exit(1);
  }
};

startServer();