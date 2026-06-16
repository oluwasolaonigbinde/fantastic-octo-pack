"use client";

import { Button } from "@/components/base";
import { Input } from "@/components/base";
import { SingleSelect } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchCategories } from "@/store/slices/category-slice";
import { Product } from "@/types/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { NewProductForm, newProductSchema } from "./new-product.schema";
import { Textarea } from "@/components/ui/textarea";

const ProductInfoForm = () => {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { categories, isLoading } = useAppSelector((state) => state.category);
  const { product } = useAppSelector((state) => state.product);

  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Load categories + check if editing existing product
  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories({}));
    }

    if (product?._id === params.id) {
      queueMicrotask(() => setCurrentProduct(product));
    }
  }, [categories, dispatch, params.id, product]);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    reset,
    formState: { errors, touchedFields },
  } = useForm<NewProductForm>({
    resolver: zodResolver(newProductSchema),
    defaultValues: {
      name: "",
      category: "",
      quantityAvailable: 0,
      priceMode: "fixed" as "fixed" | "negotiable" | undefined,
      pricePerUnit: 0,
      countries: [],
      isRfqAvailable: false,
      keySpecifications: "",
    },
  });

  // Update default values if editing a product
  useEffect(() => {
    if (currentProduct) {
      reset({
        name: currentProduct?.name || "",
        category: currentProduct?.category || "",
        quantityAvailable: currentProduct?.quantityAvailable || 0,
        priceMode: currentProduct?.priceMode || "",
        pricePerUnit: currentProduct?.pricePerUnit || 0,
        countries: currentProduct?.countries || [],
        isRfqAvailable: currentProduct?.isRfqAvailable || false,
      });
    }
  }, [currentProduct, reset]);

  // ✨ Submit handler — Save to localStorage + go to next form
  const onSubmit = (data: NewProductForm) => {
    localStorage.setItem("newProductForm", JSON.stringify(data));
    router.push("/dashboard/distributor/catalogue/new?tab=image-upload");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-6">
      <div>
        <h2 className="medium3">Product Information</h2>
        <p className="text-sm md:text-base text-gray3">
          Enter all information about the product.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          {...register("name", { onBlur: () => trigger("name") })}
          label="Product Name"
          placeholder="Enter name of product"
          error={
            errors.name && touchedFields.name ? errors.name.message : undefined
          }
        />

        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <SingleSelect
              label="Category"
              placeholder="Select category"
              value={field.value}
              onValueChange={(val) => {
                field.onChange(val);
                trigger("category");
              }}
              options={
                isLoading
                  ? [{ value: "_", label: "Fetching..." }]
                  : categories.map((item) => ({
                      value: item._id,
                      label: item.name,
                    }))
              }
              error={errors.category?.message}
            />
          )}
        />

        <Input
          {...register("quantityAvailable", {
            onBlur: () => trigger("quantityAvailable"),
            valueAsNumber: true,
          })}
          type="number"
          label="Quantity available"
          placeholder="Enter number"
          error={
            errors.quantityAvailable && touchedFields.quantityAvailable
              ? errors.quantityAvailable.message
              : undefined
          }
        />

        <Controller
          name="priceMode"
          control={control}
          render={({ field }) => (
            <SingleSelect
              label="Price mode"
              placeholder="Select option"
              value={field.value}
              onValueChange={(val) => {
                field.onChange(val);
                trigger("priceMode");
              }}
              options={[
                { value: "negotiable", label: "Negotiable" },
                { value: "fixed", label: "Fixed" },
              ]}
              error={errors.priceMode?.message}
            />
          )}
        />

        <Input
          {...register("pricePerUnit", {
            onBlur: () => trigger("pricePerUnit"),
            valueAsNumber: true,
          })}
          type="number"
          label="Price per unit"
          placeholder="Enter price"
          error={
            errors.pricePerUnit && touchedFields.pricePerUnit
              ? errors.pricePerUnit.message
              : undefined
          }
        />

        <Controller
          name="countries"
          control={control}
          render={({ field }) => (
            <SingleSelect
              label="Country"
              placeholder="Select countries"
              value={field.value?.[0] || ""}
              onValueChange={(val) => {
                field.onChange([val]);
                trigger("countries");
              }}
              options={[
                { value: "NG", label: "Nigeria" },
                { value: "USA", label: "USA" },
                { value: "EN", label: "England" },
                { value: "GH", label: "Ghana" },
              ]}
              error={errors.countries?.message as string | undefined}
            />
          )}
        />

        <Controller
          name="isRfqAvailable"
          control={control}
          render={({ field }) => (
            <SingleSelect
              label="RFQ availability"
              placeholder="Select option"
              value={String(field.value)}
              onValueChange={(val) => {
                field.onChange(val === "true");
                trigger("isRfqAvailable");
              }}
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
              error={errors.isRfqAvailable?.message}
            />
          )}
        />

        <div className="md:col-span-2 lg:col-span-3">
          <Textarea
            {...register("keySpecifications", { onBlur: () => trigger("keySpecifications") })}
            label="Key specifications"
            placeholder="Enter specs here..."
            error={errors.keySpecifications?.message}
            className="min-h-24"
          />
        </div>
      </div>

      <Button
        title="Save & Continue"
        size="md"
        iconRight={<ArrowRight size={15} />}
        className="max-w-[320px]"
        type="submit"
      />
    </form>
  );
};

export default ProductInfoForm;
