import {
  UploadApiOptions,
  UploadApiResponse,
} from "cloudinary";

import configureCloudinary from "../config/cloudinary";

/* =========================================================
   UPLOAD IMAGE

   folder example:
   hivrasoft/category-images/women/bra/sports-bra

   publicId example:
   front-view

   final Cloudinary public_id:
   hivrasoft/category-images/women/bra/sports-bra/front-view
========================================================= */

export const uploadImageBuffer =
  async (
    buffer: Buffer,
    folder: string,
    publicId?: string
  ): Promise<UploadApiResponse> => {
    const cloudinary =
      configureCloudinary();

    return new Promise(
      (
        resolve,
        reject
      ) => {
        const options:
          UploadApiOptions = {
          folder,

          resource_type:
            "image",

          overwrite:
            false,
        };

        /*
          Existing Product uploader publicId nahi bhejta,
          isliye old upload flow break nahi hoga.

          Category uploader publicId bhejta hai,
          jisse admin ka Photo Name actual Cloudinary
          asset name banega.
        */
        if (publicId) {
          options.public_id =
            publicId;

          options.unique_filename =
            false;

          options.use_filename =
            false;
        } else {
          options.unique_filename =
            true;
        }

        const uploadStream =
          cloudinary.uploader.upload_stream(
            options,
            (
              error,
              result
            ) => {
              if (
                error ||
                !result
              ) {
                reject(
                  error ||
                    new Error(
                      "Cloudinary upload failed."
                    )
                );

                return;
              }

              resolve(
                result
              );
            }
          );

        uploadStream.end(
          buffer
        );
      }
    );
  };


/* =========================================================
   MOVE / RENAME IMAGE

   Used when category name changes or an uploaded asset
   needs to be normalized into the category's own folder.

   Example:
   from:
   hivrasoft/category-images/old-name/front-view

   to:
   hivrasoft/category-images/new-name/front-view
========================================================= */

export const moveCloudinaryImage =
  async (
    fromPublicId: string,
    toPublicId: string
  ) => {
    if (
      !fromPublicId ||
      !toPublicId
    ) {
      throw new Error(
        "Cloudinary source and destination publicId are required."
      );
    }

    if (
      fromPublicId ===
      toPublicId
    ) {
      return null;
    }

    const cloudinary =
      configureCloudinary();

    return cloudinary.uploader.rename(
      fromPublicId,
      toPublicId,
      {
        resource_type:
          "image",

        overwrite:
          false,

        invalidate:
          true,
      }
    );
  };

/* =========================================================
   DELETE ONE IMAGE
========================================================= */

export const deleteCloudinaryImage =
  async (
    publicId: string
  ) => {
    if (!publicId) {
      throw new Error(
        "Cloudinary publicId is required."
      );
    }

    const cloudinary =
      configureCloudinary();

    return cloudinary.uploader.destroy(
      publicId,
      {
        resource_type:
          "image",

        invalidate:
          true,
      }
    );
  };

/* =========================================================
   DELETE MANY IMAGES

   Category delete hone par images[] ke sab publicId
   Cloudinary se destroy honge.
========================================================= */

export const deleteCloudinaryImages =
  async (
    publicIds: string[]
  ) => {
    const uniqueIds =
      Array.from(
        new Set(
          publicIds
            .map(
              (
                value
              ) =>
                value.trim()
            )
            .filter(
              Boolean
            )
        )
      );

    if (
      uniqueIds.length ===
      0
    ) {
      return [];
    }

    return Promise.all(
      uniqueIds.map(
        (
          publicId
        ) =>
          deleteCloudinaryImage(
            publicId
          )
      )
    );
  };

/* =========================================================
   FOLDER FROM PUBLIC ID

   hivrasoft/category-images/women/bra/front
   ->
   hivrasoft/category-images/women/bra
========================================================= */

export const getCloudinaryFolderFromPublicId =
  (
    publicId: string
  ): string => {
    const parts =
      publicId
        .split("/")
        .filter(
          Boolean
        );

    parts.pop();

    return parts.join(
      "/"
    );
  };

/* =========================================================
   DELETE EMPTY CLOUDINARY FOLDER

   Cloudinary folder mode/account behavior ke hisab se
   folder deletion fail ho sakta hai. Images ka destroy
   main cleanup hai; empty-folder removal best-effort hai.
========================================================= */

export const deleteCloudinaryFolderIfEmpty =
  async (
    folder: string
  ) => {
    if (!folder) {
      return;
    }

    try {
      const cloudinary =
        configureCloudinary();

      await cloudinary.api.delete_folder(
        folder
      );
    } catch {
      /*
        Ignore:
        - folder already gone
        - dynamic folders mode
        - folder not empty
      */
    }
  };
