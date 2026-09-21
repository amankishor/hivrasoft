import {
  Request,
  Response,
} from "express";

import {
  uploadImageBuffer,
  deleteCloudinaryImage,
} from "../services/cloudinary.service";

/* =========================================================
   SAFE TEXT -> CLOUDINARY SEGMENT
========================================================= */

const createSafeSegment =
  (
    value: unknown,
    fallback: string
  ): string => {
    if (
      typeof value !==
      "string"
    ) {
      return fallback;
    }

    const safe =
      value
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-z0-9_-]+/g,
          "-"
        )
        .replace(
          /-+/g,
          "-"
        )
        .replace(
          /^[-_]+|[-_]+$/g,
          ""
        );

    return safe ||
      fallback;
  };

/* =========================================================
   SAFE FOLDER

   Input:
   category-images/Women/Bra/Sports Bra

   Output:
   category-images/women/bra/sports-bra
========================================================= */

const createSafeFolder =
  (
    folderInput: unknown
  ): string => {
    const raw =
      typeof folderInput ===
      "string"
        ? folderInput
        : "products";

    const segments =
      raw
        .split("/")
        .map(
          (
            segment
          ) =>
            createSafeSegment(
              segment,
              ""
            )
        )
        .filter(
          Boolean
        );

    return (
      segments.join(
        "/"
      ) ||
      "products"
    );
  };

/* =========================================================
   SAFE IMAGE NAME

   Admin:
   "Front View"

   Cloudinary public_id filename:
   "front-view"
========================================================= */

const createSafeImageName =
  (
    imageNameInput: unknown
  ):
    | string
    | undefined => {
    if (
      typeof imageNameInput !==
      "string" ||
      !imageNameInput.trim()
    ) {
      /*
        Product uploader jaise existing callers
        imageName nahi bhejte.
        Unke liye Cloudinary unique filename use karega.
      */
      return undefined;
    }

    return createSafeSegment(
      imageNameInput,
      "image"
    );
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
            success:
              false,

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

      const imageName =
        createSafeImageName(
          req.body.imageName
        );

      const result =
        await uploadImageBuffer(
          req.file.buffer,
          folder,
          imageName
        );

      return res
        .status(201)
        .json({
          success:
            true,

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

            /*
              Actual final Cloudinary filename.
              publicId ke last part ko return kar rahe hain.
            */
            cloudinaryName:
              result.public_id
                .split("/")
                .pop() ||
              "",
          },
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error instanceof
            Error
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
      } =
        req.body;

      if (
        !publicId ||
        typeof publicId !==
          "string"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

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
          success:
            true,

          message:
            "Image deleted successfully.",

          result:
            result.result,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to delete image.",
        });
    }
  };
