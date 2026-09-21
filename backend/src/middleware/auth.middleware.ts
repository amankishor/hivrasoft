// middleware/auth.middleware.ts

import {
  Request,
  Response,
  NextFunction,
} from "express";

import User from "../models/User.model";
import { verifyToken } from "../utils/jwt";

/* =========================================================
   AUTHENTICATE
========================================================= */

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    /* ===============================================
       IMPORTANT:
       Login me cookie ka naam accessToken hai
    =============================================== */

    const token =
      req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message:
          "Not authenticated",
      });

      return;
    }

    /* ===============================================
       VERIFY TOKEN
    =============================================== */

    const decoded =
      verifyToken(token);

    if (!decoded?.id) {
      res.status(401).json({
        success: false,
        message:
          "Invalid session",
      });

      return;
    }

    /* ===============================================
       FIND USER
    =============================================== */

    const user =
      await User.findById(
        decoded.id
      );

    if (!user) {
      res.status(401).json({
        success: false,
        message:
          "User not found",
      });

      return;
    }

    /* ===============================================
       ACTIVE USER
    =============================================== */

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message:
          "Account is disabled",
      });

      return;
    }

    /* ===============================================
       ATTACH USER
    =============================================== */

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "AUTH ERROR:",
      error
    );

    res.status(401).json({
      success: false,
      message:
        "Invalid or expired session",
    });

    return;
  }
};

/* =========================================================
   PROTECT ALIAS

   Agar routes me protect use karna hai
========================================================= */

export const protect =
  authenticate;
