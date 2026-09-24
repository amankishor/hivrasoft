import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { createOrderController, getMyOrdersController } from "../controllers/order.controller";

const router = Router();
router.use(authenticate);
router.get("/", getMyOrdersController);
router.post("/", createOrderController);
export default router;
