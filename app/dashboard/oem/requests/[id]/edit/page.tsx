"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileText, X } from "lucide-react";

import Header from "../../../../component/header";
import { Button, Input, PopUp, SingleSelect } from "@/components/base";
import {
  SimpleRichTextEditor,
  richHtmlToPlainText,
} from "@/components/oem/SimpleRichTextEditor";
import { Textarea } from "@/components/ui/textarea";
import categoryService from "@/services/categoryService";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchProductById, updateProductById } from "@/store/slices/product-slice";
import type { Category } from "@/types/categories";
import type {
  CustomSpecification,
  KeyAttributeItem,
  Product,
  ProductImage,
  UpdateProduct,
} from "@/types/product";

import {
  buildCustomSpecificationsText,
  extractEditableModel,
} from "../../../oem-ui";

type EditableFormState = {
  name: string;
  category: string;
  subCategory: string;
  model: string;
  brand: string;
  description: string;
  pricePerUnit: string;
  keySpecificationsText: string;
  customSpecificationsText: string;
};

type ImageCard =
  | {
      key: string;
      label: string;
      preview: string;
      kind: "existing";
      mergedIndex: number;
      sourceIndex: number;
    }
  | {
      key: string;
      label: string;
      preview: string;
      kind: "staged";
      mergedIndex: number;
      sourceIndex: number;
    }
  | {
      key: string;
      label: string;
      preview: "";
      kind: "placeholder";
    };

const EMPTY_FORM: EditableFormState = {
  name: "",
  category: "",
  subCategory: "",
  model: "",
  brand: "",
  description: "",
  pricePerUnit: "",
  keySpecificationsText: "",
  customSpecificationsText: "",
};

const SECTION_LABELS = [
  "Product category",
  "Product basic info",
  "Stock & Availability",
  "Pricing",
  "Image upload",
];

const FALLBACK_SUBCATEGORY_OPTIONS = [
  { value: "Imaging", label: "Imaging" },
  { value: "Monitoring", label: "Monitoring" },
  { value: "Consumables", label: "Consumables" },
];

const MAX_IMAGE_COUNT = 8;
const MIN_VISIBLE_IMAGE_SLOTS = 4;
const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;
const PRODUCT_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const PRODUCT_DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".png"];
const DOCUMENT_UPLOAD_ERROR = "Upload a PDF, DOCX, or PNG file under 5 MB.";
const IMAGE_UPLOAD_ERROR = "Images must be JPG, PNG, or WEBP files under 5 MB each.";

const parseAttributes = (value: string, includeModel?: string): KeyAttributeItem[] => {
  const lines = value
    .split("\n")
    .map((line) => line.replace(/^-/, "").trim())
    .filter(Boolean);

  const items = lines.map((line) => {
    const [label, ...rest] = line.split(":");
    const detail = rest.join(":").trim();

    if (!detail) {
      return {
        spec: "Specification",
        detail: label.trim(),
      };
    }

    return {
      spec: label.trim(),
      detail,
    };
  });

  if (includeModel?.trim()) {
    items.unshift({ spec: "Model", detail: includeModel.trim() });
  }

  return items;
};

/** Maps the key/custom specification text fields to the backend `customSpecifications` shape. */
const buildCustomSpecificationsPayload = (
  form: Pick<EditableFormState, "keySpecificationsText" | "customSpecificationsText" | "model">,
): CustomSpecification[] | undefined => {
  const items = [
    ...parseAttributes(richHtmlToPlainText(form.keySpecificationsText)),
    ...parseAttributes(richHtmlToPlainText(form.customSpecificationsText), form.model),
  ]
    .filter((item) => item.spec && item.detail)
    .map((item) => ({ key: item.spec as string, value: item.detail as string }));

  return items.length > 0 ? items : undefined;
};

const getDefaultImageIndex = (images: ProductImage[]) => {
  const index = images.findIndex((image) => image.isDefault);
  return index >= 0 ? index : 0;
};

const buildFormFromProduct = (product: Product): EditableFormState => ({
  name: product.name || "",
  category: product.category || "",
  subCategory: product.sub_category?.[0] || "",
  model: extractEditableModel(product),
  brand: product.brand_oem || "",
  description: product.description || "",
  pricePerUnit: product.pricePerUnit ? String(product.pricePerUnit) : "",
  keySpecificationsText: product.keySpecifications || "",
  customSpecificationsText: buildCustomSpecificationsText(product),
});

const omitKey = <T extends Record<string, unknown>>(record: T, key: string) => {
  const next = { ...record };
  delete next[key];
  return next as T;
};

const clampDefaultImageIndex = (requestedIndex: number, totalImages: number) => {
  if (totalImages <= 0) {
    return 0;
  }

  return Math.min(Math.max(requestedIndex, 0), totalImages - 1);
};

const getNextDefaultAfterRemoval = (
  currentDefaultIndex: number,
  removedIndex: number,
  nextTotalImages: number,
) => {
  if (nextTotalImages <= 0) {
    return 0;
  }

  if (removedIndex < currentDefaultIndex) {
    return currentDefaultIndex - 1;
  }

  if (removedIndex === currentDefaultIndex) {
    return Math.min(currentDefaultIndex, nextTotalImages - 1);
  }

  return Math.min(currentDefaultIndex, nextTotalImages - 1);
};

const buildBaseUpdatePayload = (
  product: Product,
  form: EditableFormState,
  retainedImages: ProductImage[],
  defaultImageIndex: number,
): UpdateProduct => ({
  name: form.name.trim(),
  category: form.category.trim(),
  sub_category: form.subCategory.trim() ? [form.subCategory.trim()] : undefined,
  brand_oem: form.brand.trim() || undefined,
  description: form.description.trim() || undefined,
  pricePerUnit: form.pricePerUnit ? Number(form.pricePerUnit) : undefined,
  customSpecifications: buildCustomSpecificationsPayload(form),
  images: retainedImages.map((image, index) => ({
    ...image,
    isDefault: index === defaultImageIndex,
  })),
});

const appendIfPresent = (formData: FormData, key: string, value: string | undefined) => {
  if (value) {
    formData.append(key, value);
  }
};

const getFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
};

const isAllowedFile = (file: File, allowedExtensions: string[]) =>
  file.size <= MAX_UPLOAD_FILE_SIZE && allowedExtensions.includes(getFileExtension(file.name));

export default function OemEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const dispatch = useAppDispatch();
  const { data: authData } = useAppSelector((state) => state.auth);
  const { product, isLoading } = useAppSelector((state) => state.product);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const certificationInputRef = useRef<HTMLInputElement | null>(null);
  const brochureInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [draftFormByProductId, setDraftFormByProductId] = useState<
    Record<string, Partial<EditableFormState>>
  >({});
  const [defaultImageIndexByProductId, setDefaultImageIndexByProductId] = useState<
    Record<string, number>
  >({});
  const [retainedImagesByProductId, setRetainedImagesByProductId] = useState<
    Record<string, ProductImage[]>
  >({});
  const [stagedImagesByProductId, setStagedImagesByProductId] = useState<
    Record<string, File[]>
  >({});
  const [stagedCertificationByProductId, setStagedCertificationByProductId] = useState<
    Record<string, File | null>
  >({});
  const [stagedBrochureByProductId, setStagedBrochureByProductId] = useState<
    Record<string, File | null>
  >({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [assetNotice, setAssetNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [assetErrors, setAssetErrors] = useState<Partial<Record<"images" | "certifications" | "brochure", string>>>({});

  const token = authData?.tokens?.accessToken ?? "";
  const productId = product?._id ?? "";

  useEffect(() => {
    if (id && token) {
      dispatch(fetchProductById({ id, token }));
    }
  }, [dispatch, id, token]);

  useEffect(() => {
    let ignore = false;

    void categoryService
      .fetchCategories(1, 50)
      .then((response) => {
        if (!ignore) {
          setCategories(response.data.docs);
        }
      })
      .catch(() => {
        if (!ignore) {
          setCategories([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const baseForm = useMemo(
    () => (product ? buildFormFromProduct(product) : EMPTY_FORM),
    [product],
  );
  const form = useMemo(
    () => ({
      ...baseForm,
      ...(productId ? draftFormByProductId[productId] ?? {} : {}),
    }),
    [baseForm, draftFormByProductId, productId],
  );

  const existingImages = useMemo(() => product?.images ?? [], [product]);
  const retainedImages = useMemo(
    () => (productId ? retainedImagesByProductId[productId] ?? existingImages : existingImages),
    [existingImages, productId, retainedImagesByProductId],
  );
  const stagedImages = useMemo(
    () => (productId ? stagedImagesByProductId[productId] ?? [] : []),
    [productId, stagedImagesByProductId],
  );
  const stagedCertification = useMemo(
    () => (productId ? stagedCertificationByProductId[productId] ?? null : null),
    [productId, stagedCertificationByProductId],
  );
  const stagedBrochure = useMemo(
    () => (productId ? stagedBrochureByProductId[productId] ?? null : null),
    [productId, stagedBrochureByProductId],
  );

  const stagedImagePreviews = useMemo(
    () =>
      stagedImages.map((image) => ({
        file: image,
        previewUrl: URL.createObjectURL(image),
      })),
    [stagedImages],
  );

  useEffect(() => {
    return () => {
      stagedImagePreviews.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    };
  }, [stagedImagePreviews]);

  const mergedImageCount = retainedImages.length + stagedImages.length;
  const defaultImageIndex = useMemo(() => {
    const fallbackIndex = getDefaultImageIndex(retainedImages);
    const requestedIndex =
      productId && defaultImageIndexByProductId[productId] !== undefined
        ? defaultImageIndexByProductId[productId]
        : fallbackIndex;

    return clampDefaultImageIndex(requestedIndex, mergedImageCount);
  }, [defaultImageIndexByProductId, mergedImageCount, productId, retainedImages]);

  const categoryOptions = useMemo(() => {
    const dynamicOptions = categories.map((category) => ({
      value: category.name,
      label: category.name,
    }));

    if (form.category && !dynamicOptions.some((option) => option.value === form.category)) {
      dynamicOptions.unshift({ value: form.category, label: form.category });
    }

    return dynamicOptions;
  }, [categories, form.category]);

  const subCategoryOptions = useMemo(() => {
    if (
      form.subCategory &&
      !FALLBACK_SUBCATEGORY_OPTIONS.some((option) => option.value === form.subCategory)
    ) {
      return [
        { value: form.subCategory, label: form.subCategory },
        ...FALLBACK_SUBCATEGORY_OPTIONS,
      ];
    }

    return FALLBACK_SUBCATEGORY_OPTIONS;
  }, [form.subCategory]);

  const imageCards = useMemo<ImageCard[]>(() => {
    const existingCards: ImageCard[] = retainedImages.map((image, index) => ({
      key: image.cloudinary_id || image.url,
      label: image.originalName || "Existing image",
      preview: image.url,
      kind: "existing",
      mergedIndex: index,
      sourceIndex: index,
    }));

    const stagedCards: ImageCard[] = stagedImagePreviews.map((entry, index) => ({
      key: `${entry.file.name}-${index}`,
      label: entry.file.name,
      preview: entry.previewUrl,
      kind: "staged",
      mergedIndex: retainedImages.length + index,
      sourceIndex: index,
    }));

    const mergedCards: ImageCard[] = [...existingCards, ...stagedCards];
    const visibleCards = [...mergedCards];
    const targetSlots = Math.max(MIN_VISIBLE_IMAGE_SLOTS, mergedCards.length);

    while (visibleCards.length < targetSlots) {
      visibleCards.push({
        key: `placeholder-${visibleCards.length}`,
        label: "Empty slot",
        preview: "",
        kind: "placeholder",
      });
    }

    return visibleCards;
  }, [retainedImages, stagedImagePreviews]);

  const updateForm = <K extends keyof EditableFormState>(
    field: K,
    value: EditableFormState[K],
  ) => {
    if (!productId) {
      return;
    }

    setDraftFormByProductId((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? {}),
        [field]: value,
      },
    }));
  };

  const handleRemoveImageCard = (card: Extract<ImageCard, { kind: "existing" | "staged" }>) => {
    if (!productId) {
      return;
    }

    const nextTotalImages = mergedImageCount - 1;
    const nextDefaultImageIndex = getNextDefaultAfterRemoval(
      defaultImageIndex,
      card.mergedIndex,
      nextTotalImages,
    );

    setDefaultImageIndexByProductId((current) => ({
      ...current,
      [productId]: nextDefaultImageIndex,
    }));

    if (card.kind === "existing") {
      setRetainedImagesByProductId((current) => ({
        ...current,
        [productId]: retainedImages.filter((_, index) => index !== card.sourceIndex),
      }));
      return;
    }

    setStagedImagesByProductId((current) => ({
      ...current,
      [productId]: stagedImages.filter((_, index) => index !== card.sourceIndex),
    }));
  };

  const handleImageSelection = (fileList: FileList | null) => {
    if (!productId || !fileList?.length) {
      return;
    }

    const availableSlots = Math.max(0, MAX_IMAGE_COUNT - mergedImageCount);
    const selectedFiles = Array.from(fileList);
    const acceptedImages = selectedFiles.filter((file) =>
      isAllowedFile(file, PRODUCT_IMAGE_EXTENSIONS),
    );

    if (acceptedImages.length !== selectedFiles.length) {
      setAssetErrors((current) => ({ ...current, images: IMAGE_UPLOAD_ERROR }));
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      return;
    }

    const nextImages = acceptedImages.slice(0, availableSlots);

    if (nextImages.length === 0) {
      setAssetErrors((current) => ({
        ...current,
        images: `You can upload a maximum of ${MAX_IMAGE_COUNT} product images.`,
      }));
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      return;
    }

    setStagedImagesByProductId((current) => ({
      ...current,
      [productId]: [...(current[productId] ?? []), ...nextImages],
    }));

    if (mergedImageCount === 0) {
      setDefaultImageIndexByProductId((current) => ({
        ...current,
        [productId]: 0,
      }));
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    setAssetErrors((current) => ({ ...current, images: undefined }));
  };

  const handleDocumentSelection = (
    field: "certifications" | "brochure",
    fileList: FileList | null,
  ) => {
    if (!productId) {
      return;
    }

    const file = fileList?.[0] ?? null;
    if (!file) {
      return;
    }

    if (!isAllowedFile(file, PRODUCT_DOCUMENT_EXTENSIONS)) {
      setAssetErrors((current) => ({ ...current, [field]: DOCUMENT_UPLOAD_ERROR }));
      if (field === "certifications" && certificationInputRef.current) {
        certificationInputRef.current.value = "";
      }
      if (field === "brochure" && brochureInputRef.current) {
        brochureInputRef.current.value = "";
      }
      return;
    }

    setAssetErrors((current) => ({ ...current, [field]: undefined }));

    if (field === "certifications") {
      setStagedCertificationByProductId((current) => ({
        ...current,
        [productId]: file,
      }));
      return;
    }

    setStagedBrochureByProductId((current) => ({
      ...current,
      [productId]: file,
    }));
  };

  const handleSave = async () => {
    if (!product || !token || !productId) {
      return;
    }

    setSaveError("");

    if (mergedImageCount === 0) {
      setSaveError("Add at least one image before updating this product.");
      return;
    }

    const normalizedDefaultImageIndex = clampDefaultImageIndex(defaultImageIndex, mergedImageCount);
    const basePayload = buildBaseUpdatePayload(
      product,
      form,
      retainedImages,
      clampDefaultImageIndex(defaultImageIndex, Math.max(retainedImages.length, 1)),
    );
    const hasMultipartUploads =
      stagedImages.length > 0 || Boolean(stagedCertification) || Boolean(stagedBrochure);

    const productData: FormData | UpdateProduct = hasMultipartUploads
      ? (() => {
          const formData = new FormData();

          appendIfPresent(formData, "name", basePayload.name);
          appendIfPresent(formData, "category", basePayload.category);
          appendIfPresent(formData, "sub_category", basePayload.sub_category?.[0]);
          appendIfPresent(formData, "brand_oem", basePayload.brand_oem);
          appendIfPresent(formData, "description", basePayload.description);

          if (typeof basePayload.pricePerUnit === "number") {
            formData.append("pricePerUnit", String(basePayload.pricePerUnit));
          }

          if (basePayload.customSpecifications) {
            formData.append("customSpecifications", JSON.stringify(basePayload.customSpecifications));
          }

          formData.append("existingImages", JSON.stringify(retainedImages));
          formData.append("defaultImageIndex", String(normalizedDefaultImageIndex));

          stagedImages.forEach((image) => {
            formData.append("images", image);
          });

          if (stagedCertification) {
            formData.append("certifications", stagedCertification);
          }

          if (stagedBrochure) {
            formData.append("brochure", stagedBrochure);
          }

          return formData;
        })()
      : {
          ...basePayload,
          images: retainedImages.map((image, index) => ({
            ...image,
            isDefault: index === normalizedDefaultImageIndex,
          })),
        };

    try {
      await dispatch(
        updateProductById({
          token,
          id: product._id,
          productData,
        }),
      ).unwrap();
      await dispatch(fetchProductById({ id: product._id, token })).unwrap();

      setDraftFormByProductId((current) => omitKey(current, product._id));
      setDefaultImageIndexByProductId((current) => omitKey(current, product._id));
      setRetainedImagesByProductId((current) => omitKey(current, product._id));
      setStagedImagesByProductId((current) => omitKey(current, product._id));
      setStagedCertificationByProductId((current) => omitKey(current, product._id));
      setStagedBrochureByProductId((current) => omitKey(current, product._id));
      setAssetNotice("");

      if (certificationInputRef.current) {
        certificationInputRef.current.value = "";
      }
      if (brochureInputRef.current) {
        brochureInputRef.current.value = "";
      }
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      setShowSuccess(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "We could not update this product.");
    }
  };

  if (isLoading && !product) {
    return (
      <div>
        <Header
          title="Listing Request"
          description="View all, approve or deny all product listing request"
        />
        <div className="bg-[#F9FAFB] p-6 text-sm text-gray3">Loading editable product...</div>
      </div>
    );
  }

  if (!isLoading && !product) {
    return (
      <div>
        <Header
          title="Listing Request"
          description="View all, approve or deny all product listing request"
        />
        <div className="bg-[#F9FAFB] p-6 text-sm text-danger">
          The editable product could not be loaded.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Listing Request"
        description="View all, approve or deny all product listing request"
      />

      <div className="space-y-4 bg-[#F9FAFB] p-4 md:p-6">
        <Link
          href={`/dashboard/oem/requests/${id}`}
          className="inline-flex items-center gap-2 text-[18px] leading-8 text-[#111827]"
        >
          <ArrowLeft size={24} strokeWidth={1.5} aria-hidden />
          Go Back
        </Link>

        <section className="rounded-2xl border border-[#DDE0E5] bg-white px-5 py-6">
          <h2 className="text-xl font-medium leading-8 text-[#111827]">Edit Product</h2>
          <p className="mt-1 text-base leading-6 text-[#6B7280]">
            Kindly update the information below to edit this product, and submit.
          </p>
        </section>

        <section className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <aside className="w-full shrink-0 rounded-2xl border border-[#DDE0E5] bg-white px-5 py-8 xl:w-[278px]">
            <ul className="space-y-8 text-base leading-6 text-[#0669D9]">
              {SECTION_LABELS.map((label) => (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded border border-[#0669D9] bg-[#EAF9FF] text-[#0669D9]"
                    aria-hidden
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="min-w-0 flex-1 rounded-2xl border border-[#DDE0E5] bg-white px-5 py-6">
            <div>
              <h3 className="text-xl font-medium leading-8 text-[#111827]">
                Editable Product Information
              </h3>
              <p className="mt-1 text-base leading-6 text-[#111827]">
                Update the information below with the correct entry.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-5">
              <div className="w-full min-w-[200px] max-w-[250px] flex-1">
                <Input
                  id="oem-product-name"
                  label="Product name"
                  value={form.name}
                  onValueChange={(value) => updateForm("name", value)}
                  placeholder="Name of the product"
                />
              </div>
              <div className="w-full min-w-[200px] max-w-[250px] flex-1">
                <SingleSelect
                  label="Category"
                  value={form.category}
                  onValueChange={(value) => updateForm("category", value)}
                  options={categoryOptions}
                  placeholder="Equipment"
                />
              </div>
              <div className="w-full min-w-[200px] max-w-[250px] flex-1">
                <SingleSelect
                  label="Sub category"
                  value={form.subCategory}
                  onValueChange={(value) => updateForm("subCategory", value)}
                  options={subCategoryOptions}
                  placeholder="Sub category"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-5">
              <div className="w-full min-w-[200px] max-w-[250px] flex-1">
                <Input
                  id="oem-product-model"
                  label="Model"
                  value={form.model}
                  onValueChange={(value) => updateForm("model", value)}
                  placeholder="The model"
                />
              </div>
              <div className="w-full min-w-[200px] max-w-[250px] flex-1">
                <Input
                  id="oem-product-brand"
                  label="Brand"
                  value={form.brand}
                  onValueChange={(value) => updateForm("brand", value)}
                  placeholder="The brand"
                />
              </div>
            </div>

            <div className="mt-6">
              <Textarea
                id="oem-product-description"
                label="Description"
                rows={4}
                value={form.description}
                onValueChange={(value) => updateForm("description", value)}
                placeholder="Describe this product"
                className="min-h-[100px] rounded-xl border-[#DDE0E5]"
              />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="type-label px-4 font-medium text-gray2">Update certifications</span>
                <label className="flex min-h-[142px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border border-[#DDE0E5] bg-white px-4 py-4 text-center">
                  <FileText size={40} className="text-[#6B7280]" aria-hidden />
                  <span className="text-base text-[#C4C8CE]">
                    <span className="text-[#FE6E00]">Click here</span>
                    <span> to upload file</span>
                  </span>
                  <span className="text-sm leading-5 text-[#C4C8CE]">
                    Allowed format - DOCX, PNG, PDF
                  </span>
                  <input
                    ref={certificationInputRef}
                    type="file"
                    accept=".docx,.png,.pdf"
                    className="hidden"
                    onChange={(event) => handleDocumentSelection("certifications", event.target.files)}
                  />
                </label>
                {stagedCertification ? (
                  <p className="truncate px-4 text-sm text-gray2">{stagedCertification.name}</p>
                ) : null}
                {assetErrors.certifications ? (
                  <p className="px-4 text-sm text-danger">{assetErrors.certifications}</p>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <span className="type-label px-4 font-medium text-gray2">Update brochure</span>
                <label className="flex min-h-[142px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border border-[#DDE0E5] bg-white px-4 py-4 text-center">
                  <FileText size={40} className="text-[#6B7280]" aria-hidden />
                  <span className="text-base text-[#C4C8CE]">
                    <span className="text-[#FE6E00]">Click here</span>
                    <span> to upload file</span>
                  </span>
                  <span className="text-sm leading-5 text-[#C4C8CE]">
                    Allowed format - DOCX, PNG, PDF
                  </span>
                  <input
                    ref={brochureInputRef}
                    type="file"
                    accept=".docx,.png,.pdf"
                    className="hidden"
                    onChange={(event) => handleDocumentSelection("brochure", event.target.files)}
                  />
                </label>
                {stagedBrochure ? (
                  <p className="truncate px-4 text-sm text-gray2">{stagedBrochure.name}</p>
                ) : null}
                {assetErrors.brochure ? (
                  <p className="px-4 text-sm text-danger">{assetErrors.brochure}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6">
              <SimpleRichTextEditor
                id="oem-key-specifications"
                label="Key specifications"
                value={form.keySpecificationsText}
                onChange={(value) => updateForm("keySpecificationsText", value)}
                editorMinHeightClassName="min-h-[200px]"
              />
            </div>

            <div className="mt-6">
              <SimpleRichTextEditor
                id="oem-custom-specifications"
                label="Custom specifications"
                value={form.customSpecificationsText}
                onChange={(value) => updateForm("customSpecificationsText", value)}
                editorMinHeightClassName="min-h-[160px]"
              />
            </div>

            <div className="mt-8">
              <h4 className="text-lg font-medium leading-7 text-[#111827]">Uploaded images</h4>

              <div className="mt-4 grid max-w-[634px] grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
                {imageCards.map((image) => (
                  <div key={image.key} className="max-w-[301px] space-y-3">
                    <div className="relative min-h-[90px] w-full max-w-[301px]">
                      {image.kind === "placeholder" ? (
                        <button
                          type="button"
                          className="relative flex h-[90px] w-[130px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-[#E8ECF4] bg-[#F3F4F6] text-left"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <span className="px-2 text-center text-xs text-[#9CA3AF]">
                            Click to add image
                          </span>
                        </button>
                      ) : (
                        <div className="relative flex h-[90px] w-[130px] items-center justify-center overflow-hidden rounded-lg border border-[#E8ECF4] bg-[#F3F4F6]">
                          <button
                            type="button"
                            onClick={() => handleRemoveImageCard(image)}
                            className="absolute right-2 top-2 z-10 inline-flex size-3.5 items-center justify-center rounded-full bg-white text-gray2 shadow-sm"
                            aria-label={`Remove ${image.label}`}
                          >
                            <X size={12} />
                          </button>
                          {image.preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image.preview}
                              alt={image.label}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="px-2 text-center text-xs text-[#9CA3AF]">{image.label}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {image.kind !== "placeholder" ? (
                      <label className="flex cursor-pointer items-start gap-2 text-sm leading-5 text-[#111827]">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-6 shrink-0 rounded border-[#DDE0E5] accent-[#0669D9]"
                          checked={image.mergedIndex === defaultImageIndex}
                          onChange={() => {
                            if (!productId) {
                              return;
                            }

                            setDefaultImageIndexByProductId((current) => ({
                              ...current,
                              [productId]: image.mergedIndex,
                            }));
                          }}
                        />
                        <span>Use this image as your default image option</span>
                      </label>
                    ) : (
                      <div className="h-6" />
                    )}
                  </div>
                ))}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                multiple
                className="hidden"
                onChange={(event) => handleImageSelection(event.target.files)}
              />
              {assetErrors.images ? (
                <p className="mt-3 text-sm text-danger">{assetErrors.images}</p>
              ) : null}
            </div>

            {saveError ? <p className="mt-4 text-sm text-danger">{saveError}</p> : null}

            <div className="mt-10 max-w-[320px]">
              <Button
                title="Save & Update"
                className="h-[60px] rounded-xl border-0 text-base font-normal"
                iconRight={<ArrowRight className="size-5 shrink-0" aria-hidden />}
                onClick={handleSave}
              />
            </div>
          </div>
        </section>
      </div>

      <PopUp
        open={showSuccess}
        type="success"
        title="Congratulations"
        description="You have successfully updated this product information"
        primaryButtonText="Okay"
        onClose={() => {
          setShowSuccess(false);
          router.push(`/dashboard/oem/requests/${id}`);
        }}
      />

      {assetNotice ? (
        <div className="fixed bottom-4 right-4 max-w-[360px] rounded-2xl bg-white p-4 text-sm text-gray2 shadow-lg">
          {assetNotice}
        </div>
      ) : null}
    </div>
  );
}
