"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const PORT = Number(process.env.PORT || 5000);
const startServer = async () => {
    try {
        console.log("🚀 Backend starting...");
        await (0, database_1.default)();
        app_1.default.listen(PORT, () => {
            console.log(`✅ HivraSoft backend running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Server startup failed:");
        console.error(error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map