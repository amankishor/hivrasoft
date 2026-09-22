import "dotenv/config";

import app from "./app";
import connectDatabase from "./config/database";

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  try {
    console.log("🚀 Backend starting...");

    await connectDatabase();

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