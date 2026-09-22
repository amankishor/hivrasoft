import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import { hashPassword, verifyPassword } from "../utils/password";

const dummyHash = hashPassword("invalid-admin-login");

export async function adminLogin(req: Request, res: Response) {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string" ||
      username.length > 100 || password.length > 256) {
    return res.status(400).json({ message: "Enter your login ID and password." });
  }
  try {
    const user = await User.findOne({ username: username.trim() }).select("+passwordHash");
    const valid = await verifyPassword(password, user?.passwordHash || await dummyHash);
    if (!valid || !user?.isActive || !["admin", "super_admin"].includes(user.role)) {
      return res.status(401).json({ message: "Incorrect login ID or password." });
    }
    if (!process.env.JWT_SECRET) throw new Error("JWT secret missing");
    const token = jwt.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.cookie("accessToken", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  } catch {
    return res.status(503).json({ message: "Login is unavailable. Please try again." });
  }
}
