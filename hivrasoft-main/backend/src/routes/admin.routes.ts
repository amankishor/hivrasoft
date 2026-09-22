import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { adminLogin } from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();
router.post("/login", rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
}), adminLogin);
router.get("/me", authenticate, requireAdmin, (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ user: { id: String(req.user!._id), name: req.user!.name, role: req.user!.role } });
});
export default router;
