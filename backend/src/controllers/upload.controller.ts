import {
  Request,
  Response,
} from "express";

import {
  uploadImageBuffer,
  deleteCloudinaryImage,
} from "../services/cloudinary.service";

/* =========================================================
   SAFE FOLDER
========================================================= */

const createSafeFolder = (
  folderInput: unknown
): string => {
  const folder =
    typeof folderInput ===
    "string"
      ? folderInput
      : "products";

  const safeFolder =
    folder
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9/_-]/g,
        "-"
      )
      .replace(
        /\/+/g,
        "/"
      )
      .replace(
        /^\/+|\/+$/g,
        ""
      );

  return safeFolder ||
    "products";
};

/* =========================================================
   UPLOAD IMAGE
========================================================= */

export const uploadImageController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Image file is required.",
          });
      }

      const safeFolder =
        createSafeFolder(
          req.body.folder
        );

      const folder =
        `hivrasoft/${safeFolder}`;

      const result =
        await uploadImageBuffer(
          req.file.buffer,
          folder
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Image uploaded successfully.",

          image: {
            url:
              result.secure_url,

            publicId:
              result.public_id,

            width:
              result.width,

            height:
              result.height,

            format:
              result.format,
          },
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to upload image.",
        });
    }
  };

/* =========================================================
   DELETE IMAGE
========================================================= */

export const deleteImageController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        publicId,
      } = req.body;

      if (
        !publicId ||
        typeof publicId !==
          "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "publicId is required.",
          });
      }

      const result =
        await deleteCloudinaryImage(
          publicId
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Image deleted successfully.",

          result:
            result.result,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to delete image.",
        });
    }
  };