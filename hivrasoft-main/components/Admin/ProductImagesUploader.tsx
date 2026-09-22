"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

export type ImageValue = {
  url: string;
  publicId: string;
};

type ProductImagesUploaderProps = {
  label: string;

  value: ImageValue[];

  folder: string;

  disabled?: boolean;

  onUploaded: (
    images: ImageValue[]
  ) =>
    void |
    Promise<void>;

  onRemove: (
    index: number
  ) =>
    void |
    Promise<void>;

  onMakeMain?: (
    index: number
  ) =>
    void;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const MAX_FILE_SIZE =
  10 *
  1024 *
  1024;

/* =========================================================
   MULTI PRODUCT IMAGE UPLOADER

   - No fixed image-count limit in UI.
   - File picker supports MULTIPLE selection.
   - Selected files upload to existing admin upload API.
   - First image is main image.
========================================================= */

export default function ProductImagesUploader({
  label,
  value,
  folder,
  disabled = false,
  onUploaded,
  onRemove,
  onMakeMain,
}: ProductImagesUploaderProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    progress,
    setProgress,
  ] =
    useState({
      current: 0,
      total: 0,
    });

  const [
    error,
    setError,
  ] =
    useState("");

  /* =========================================================
     UPLOAD ONE FILE
  ========================================================= */

  const uploadFile =
    async (
      file: File
    ): Promise<ImageValue> => {
      const formData =
        new FormData();

      formData.append(
        "image",
        file
      );

      formData.append(
        "folder",
        folder
      );

      const response =
        await fetch(
          `${API_URL}/api/uploads/image`,
          {
            method:
              "POST",

            credentials:
              "include",

            body:
              formData,
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ||
            `Unable to upload ${file.name}.`
        );
      }

      if (
        !data.image?.url ||
        !data.image?.publicId
      ) {
        throw new Error(
          `Invalid upload response for ${file.name}.`
        );
      }

      return {
        url:
          data.image.url,

        publicId:
          data.image.publicId,
      };
    };

  /* =========================================================
     SELECT MANY + UPLOAD
  ========================================================= */

  const handleFiles =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const files =
        Array.from(
          event.target.files ||
          []
        );

      event.target.value =
        "";

      if (
        files.length ===
        0
      ) {
        return;
      }

      setError("");

      const invalidType =
        files.find(
          (
            file
          ) =>
            !ALLOWED_TYPES.includes(
              file.type
            )
        );

      if (
        invalidType
      ) {
        setError(
          `${invalidType.name}: only JPG, PNG, WEBP or AVIF images are allowed.`
        );

        return;
      }

      const tooLarge =
        files.find(
          (
            file
          ) =>
            file.size >
            MAX_FILE_SIZE
        );

      if (
        tooLarge
      ) {
        setError(
          `${tooLarge.name}: image must be smaller than 10MB.`
        );

        return;
      }

      const uploaded:
        ImageValue[] =
        [];

      try {
        setUploading(true);

        setProgress({
          current: 0,
          total:
            files.length,
        });

        /*
          Sequential upload keeps backend / Cloudinary load controlled,
          even when admin selects many photos at once.
        */
        for (
          let index = 0;
          index < files.length;
          index += 1
        ) {
          const image =
            await uploadFile(
              files[index]
            );

          uploaded.push(
            image
          );

          setProgress({
            current:
              index + 1,
            total:
              files.length,
          });
        }

        await onUploaded(
          uploaded
        );
      } catch (
        uploadError
      ) {
        /*
          Successfully uploaded files are still sent to parent state,
          so they are tracked and can be removed/cancel-cleaned safely.
        */
        if (
          uploaded.length >
          0
        ) {
          await onUploaded(
            uploaded
          );
        }

        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Image upload failed."
        );
      } finally {
        setUploading(false);

        setProgress({
          current: 0,
          total: 0,
        });
      }
    };

  return (
    <div
      className="
        rounded-[16px]
        border
        border-[#211A18]/10
        bg-[#FAF8F6]
        p-4
      "
    >
      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <p
            className="
              text-[11px]
              font-semibold
              text-[#211A18]
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1
              text-[8px]
              leading-4
              text-[#211A18]/40
            "
          >
            {value.length} image
            {value.length ===
            1
              ? ""
              : "s"}
            {" • "}
            Multiple files can be selected together.
          </p>
        </div>

        <button
          type="button"
          disabled={
            disabled ||
            uploading
          }
          onClick={() =>
            inputRef.current?.click()
          }
          className="
            inline-flex
            h-[40px]
            items-center
            justify-center
            rounded-[10px]
            bg-[#8C1839]
            px-4
            text-[8px]
            font-semibold
            uppercase
            tracking-[0.1em]
            text-white
            transition
            hover:bg-[#211A18]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {uploading
            ? `Uploading ${progress.current}/${progress.total}`
            : value.length > 0
              ? "+ Add More Photos"
              : "+ Select Photos"}
        </button>
      </div>

      <input
        ref={
          inputRef
        }
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        disabled={
          disabled ||
          uploading
        }
        onChange={
          handleFiles
        }
        className="hidden"
      />

      {uploading && (
        <div
          className="
            mt-4
            h-1.5
            overflow-hidden
            rounded-full
            bg-[#211A18]/10
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-[#8C1839]
              transition-all
            "
            style={{
              width:
                progress.total > 0
                  ? `${(
                      progress.current /
                      progress.total
                    ) * 100}%`
                  : "0%",
            }}
          />
        </div>
      )}

      {error && (
        <p
          className="
            mt-3
            rounded-[10px]
            border
            border-red-200
            bg-red-50
            px-3
            py-2
            text-[9px]
            leading-4
            text-red-600
          "
        >
          {error}
        </p>
      )}

      {value.length ===
      0 ? (
        <button
          type="button"
          disabled={
            disabled ||
            uploading
          }
          onClick={() =>
            inputRef.current?.click()
          }
          className="
            mt-4
            flex
            min-h-[190px]
            w-full
            flex-col
            items-center
            justify-center
            rounded-[14px]
            border
            border-dashed
            border-[#211A18]/20
            bg-white
            text-center
            transition
            hover:border-[#8C1839]
            hover:bg-[#FFF9F9]
            disabled:opacity-50
          "
        >
          <UploadIcon />

          <span
            className="
              mt-3
              text-[10px]
              font-semibold
              text-[#211A18]
            "
          >
            Select one or many photos
          </span>

          <span
            className="
              mt-1
              text-[8px]
              text-[#211A18]/40
            "
          >
            JPG, PNG, WEBP, AVIF • max 10MB per file
          </span>
        </button>
      ) : (
        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-3
            md:grid-cols-3
            xl:grid-cols-4
          "
        >
          {value.map(
            (
              image,
              index
            ) => (
              <div
                key={
                  image.publicId ||
                  `${image.url}-${index}`
                }
                className="
                  overflow-hidden
                  rounded-[13px]
                  border
                  border-[#211A18]/10
                  bg-white
                "
              >
                <div
                  className="
                    relative
                    aspect-[4/5]
                    overflow-hidden
                    bg-[#F3EEE8]
                  "
                >
                  <img
                    src={
                      image.url
                    }
                    alt={`${label} ${index + 1}`}
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                  />

                  {index ===
                    0 && (
                    <span
                      className="
                        absolute
                        left-2
                        top-2
                        rounded-full
                        bg-[#8C1839]
                        px-2.5
                        py-1.5
                        text-[7px]
                        font-semibold
                        uppercase
                        tracking-[0.08em]
                        text-white
                      "
                    >
                      Main
                    </span>
                  )}

                  <span
                    className="
                      absolute
                      right-2
                      top-2
                      rounded-full
                      bg-black/65
                      px-2
                      py-1
                      text-[7px]
                      text-white
                    "
                  >
                    #{index + 1}
                  </span>
                </div>

                <div
                  className="
                    flex
                    flex-wrap
                    gap-2
                    p-2.5
                  "
                >
                  {index > 0 &&
                    onMakeMain && (
                    <button
                      type="button"
                      disabled={
                        disabled ||
                        uploading
                      }
                      onClick={() =>
                        onMakeMain(
                          index
                        )
                      }
                      className="
                        flex-1
                        rounded-[8px]
                        bg-[#F8E5E8]
                        px-2
                        py-2
                        text-[7px]
                        font-semibold
                        uppercase
                        text-[#8C1839]
                        disabled:opacity-40
                      "
                    >
                      Make Main
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={
                      disabled ||
                      uploading
                    }
                    onClick={() =>
                      void onRemove(
                        index
                      )
                    }
                    className="
                      flex-1
                      rounded-[8px]
                      bg-red-50
                      px-2
                      py-2
                      text-[7px]
                      font-semibold
                      uppercase
                      text-red-600
                      disabled:opacity-40
                    "
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#8C1839]"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}
