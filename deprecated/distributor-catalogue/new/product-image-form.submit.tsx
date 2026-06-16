"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { LucideFileText, X } from "lucide-react";
import { Button } from "@/components/base";
import { PopUp } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  createNewProduct,
  resetProducts,
  submitProductById,
} from "@/store/slices/product-slice";
import type { CreateProductDto, ProductImage } from "@/types/product";
import type { NewProductForm } from "./new-product.schema";
import { useRouter } from "next/navigation";

const ProductImageForm = () => {
  const ALLOWED_FILE_TYPES = ["image/png", "image/jpg", "image/jpeg"];
  const MAX_FILE_SIZE = 4 * 1024 * 1024;

  const [files, setFiles] = useState<File[] | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [openSuccess, setOpenSuccess] = useState(false);

  const dispatch = useAppDispatch();
  const { data } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      const validFiles = filesArray.filter(
        (file) => ALLOWED_FILE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
      );

      if (validFiles.length > 5) {
        setError("You can only upload a maximum of 5 images.");
        return;
      }

      setError("");
      setFiles(validFiles);

      const previewUrls = validFiles.map((f) => URL.createObjectURL(f));
      setPreview(previewUrls);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFiles((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next.splice(index, 1);
      return next.length ? next : null;
    });

    setPreview((prev) => {
      const url = prev[index];
      try {
        URL.revokeObjectURL(url);
      } catch {}
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const imagesPayload: ProductImage[] = useMemo(() => {
    if (!files || files.length === 0) return [];
    return files.map((_, idx) => ({
      url: "",
      cloudinary_id: "",
      isDefault: idx === 0,
    }));
  }, [files]);

  // 🔥 UPDATED — This now produces a valid Product type
  const handleSubmit = useCallback(async () => {
    const raw = localStorage.getItem("newProductForm");
    if (!raw) {
      setError("Missing product details. Please complete form one.");
      return;
    }

    if (!files || files.length === 0) {
      setError("You must upload at least one product image.");
      return;
    }

    const formOne = JSON.parse(raw) as NewProductForm;

    // 🔥 Build a FULL Product object (required by your thunk)
    const productData: CreateProductDto = {
      name: formOne.name,
      category: formOne.category,
      quantityAvailable: formOne.quantityAvailable,
      priceMode: formOne.priceMode,
      pricePerUnit: formOne.pricePerUnit,
      countries: formOne.countries,
      isRfqAvailable: formOne.isRfqAvailable,
      keySpecifications: formOne.keySpecifications,
      description: (formOne as NewProductForm & { description?: string }).description ?? "",
    };

    const token =
      data?.tokens?.accessToken ||
      localStorage.getItem("accessToken") ||
      "";

    if (!token) {
      setError("Not authenticated.");
      return;
    }

    try {
      const created = await dispatch(createNewProduct({ token, productData })).unwrap();
      await dispatch(submitProductById({ token, id: created.data._id })).unwrap();

      setOpenSuccess(true);
      localStorage.removeItem("newProductForm");
      dispatch(resetProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating product.");
    }
  }, [dispatch, data?.tokens?.accessToken, files, imagesPayload, data?._id]);



  return (
    <form
      className="card p-4 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div>
        <h2 className="medium3">Image Upload</h2>
        <p className="text-sm md:text-base text-gray3">
          Upload all images for this product.
        </p>
      </div>

      <div>
        <label htmlFor="file" className="text-gray1">
          <span className="pl-3">File Upload</span>

          <div className="cursor-pointer mt-2 border border-gray5 py-6 px-3 text-center rounded-14 text-gray5">
            <LucideFileText className="text-gray5 size-[40px] mx-auto" />
            <p className="text-base">
              <span className="text-secondary">Click here</span> to upload
            </p>
            <p className="text-sm text-gray5">
              Allowed format - JPG, JPEG, PNG
            </p>
          </div>

          <input
            type="file"
            id="file"
            multiple
            onChange={handleImageChange}
            accept={"image/png,image/jpg,image/jpeg"}
            hidden
          />
        </label>

        <small className="text-sm text-danger">{error}</small>
      </div>

      {preview.length > 0 && (
        <div className="space-y-6">
          <h3 className="medium5">Uploaded images</h3>
          <div className="grid md:grid-cols-2">
            {preview.map((img, index) => (
              <div key={index} className="relative w-[190px]">
                <Image
                  src={img}
                  alt="Preview"
                  className="w-48 h-48 object-cover rounded-lg"
                  width={118}
                  height={78}
                />

                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-white/90 rounded-full p-1 border"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        title="Submit"
        type="submit"
        size="md"
        className="max-w-[320px]"
      />

      {openSuccess && (
        <PopUp
          open={openSuccess}
          type="success"
          onPrimaryAction={() => {
            setOpenSuccess(false);
            router.push("/dashboard/distributor/catalogue");
          }}
          description="Product submitted for review successfully."
        />
      )}
    </form>
  );
};

export default ProductImageForm;
