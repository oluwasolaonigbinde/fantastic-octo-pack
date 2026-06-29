"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bold,
  Check,
  CheckSquare,
  FileText,
  List,
  ListOrdered,
  Plus,
  Underline,
  Upload,
  X,
} from "lucide-react";

import Header from "../../../component/header";
import { Button, Input, PopUp, SingleSelect } from "@/components/base";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchCategories } from "@/store/slices/category-slice";
import {
  createNewProduct,
  resetProducts,
  submitProductById,
} from "@/store/slices/product-slice";
import { fetchPublicProfiles } from "@/store/slices/user-slice";
import { UserRole } from "@/types/user";

/** Seeded OEM accounts use this display name (e.g. oem@local.test) so `assignedOem` matches OEM review guards. */
const PLAYWRIGHT_OEM_DISPLAY_LABEL = "Playwright OEM";

type StepId = 1 | 2 | 3 | 4 | 5;
type Condition = "new" | "used" | "refurbished" | "";
type AvailabilityStatus = "in_stock" | "out_of_stock" | "on_order" | "";
type PricingType = "fixed" | "negotiable" | "rfq" | "";
type DurationUnit = "days" | "weeks" | "months";
type AttributeGroup = "industryAttributes" | "otherAttributes";
type AttributeRowField = "spec" | "detail";
type FieldErrorKey =
  | "category"
  | "sub_category"
  | "name"
  | "assignedOem"
  | "manufacturing_country"
  | "condition"
  | "description"
  | "availability_status"
  | "quantityAvailable"
  | "installation_time_value"
  | "installation_time_unit"
  | "delivery_time_value"
  | "delivery_time_unit"
  | "pricing_type"
  | "pricePerUnit"
  | "unit_of_measure"
  | "return_policy"
  | "sku"
  | "video_link"
  | "industryAttributes"
  | "otherAttributes"
  | "images"
  | "certifications";

type StepDefinition = {
  id: StepId;
  navLabel: string;
  panelTitle: string;
  panelDescription: string;
};

type AttributeRow = {
  spec: string;
  detail: string;
};

type WizardState = {
  category: string;
  sub_category: string;
  name: string;
  assignedOem: string;
  manufacturing_country: string;
  condition: Condition;
  description: string;
  availability_status: AvailabilityStatus;
  quantityAvailable: string;
  installation_time_value: string;
  installation_time_unit: DurationUnit;
  delivery_time_value: string;
  delivery_time_unit: DurationUnit;
  industryAttributes: AttributeRow[];
  otherAttributes: AttributeRow[];
  pricing_type: PricingType;
  pricePerUnit: string;
  unit_of_measure: string;
  return_policy: string;
  sku: string;
  video_link: string;
};

const STEPS: StepDefinition[] = [
  {
    id: 1,
    navLabel: "Product category",
    panelTitle: "Product Category",
    panelDescription: "Provide the correct information about the product category",
  },
  {
    id: 2,
    navLabel: "Product basic info",
    panelTitle: "Product Basic Info",
    panelDescription: "Provide the correct information about the product basic information",
  },
  {
    id: 3,
    navLabel: "Stock & Availability",
    panelTitle: "Stock & Availability",
    panelDescription: "Provide the correct information about stock & availability",
  },
  {
    id: 4,
    navLabel: "Pricing",
    panelTitle: "Pricing",
    panelDescription: "Provide the correct information about pricing",
  },
  {
    id: 5,
    navLabel: "Image upload",
    panelTitle: "Image Upload",
    panelDescription: "Upload images for this product",
  },
];

const WIZARD_STORAGE_KEY = "distributor-product-wizard";
const MAX_PRODUCT_IMAGE_COUNT = 8;
const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;
const PRODUCT_NAME_REGEX = /^[a-zA-Z0-9\s.,'()\-\/&+]{3,120}$/;
const DESCRIPTION_FORBIDDEN_CHARS = /[<>]/;
const SKU_REGEX = /^[A-Za-z0-9._\-\/\s]{2,100}$/;
const CERTIFICATION_EXTENSIONS = [".pdf", ".docx", ".png"];

const COUNTRY_OPTIONS = [
  { value: "Nigeria", label: "Nigeria" },
  { value: "Ghana", label: "Ghana" },
  { value: "Kenya", label: "Kenya" },
  { value: "South Africa", label: "South Africa" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "refurbished", label: "Refurbished" },
];

const AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "on_order", label: "On Order" },
];

const PRICING_TYPE_OPTIONS = [
  { value: "fixed", label: "Fixed price" },
  { value: "negotiable", label: "Negotiable" },
  { value: "rfq", label: "Request for quote" },
];

const UNIT_OF_MEASURE_OPTIONS = [
  { value: "unit", label: "Unit" },
  { value: "piece", label: "Piece" },
  { value: "set", label: "Set" },
  { value: "pack", label: "Pack" },
  { value: "kg", label: "Kg" },
  { value: "litre", label: "Litre" },
];

const DURATION_UNIT_OPTIONS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
];

const SUB_CATEGORY_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  Equipment: [
    { value: "Pumps & Compressors", label: "Pumps & Compressors" },
    { value: "Diagnostic Equipment", label: "Diagnostic Equipment" },
    { value: "Monitoring Systems", label: "Monitoring Systems" },
    { value: "Sterilization Units", label: "Sterilization Units" },
  ],
  Consumables: [
    { value: "Medical Disposables", label: "Medical Disposables" },
    { value: "Laboratory Supplies", label: "Laboratory Supplies" },
    { value: "Cleaning Supplies", label: "Cleaning Supplies" },
    { value: "Protective Wear", label: "Protective Wear" },
  ],
  Instruments: [
    { value: "Surgical Instruments", label: "Surgical Instruments" },
    { value: "Lab Instruments", label: "Lab Instruments" },
    { value: "Measuring Devices", label: "Measuring Devices" },
  ],
  Accessories: [
    { value: "Machine Accessories", label: "Machine Accessories" },
    { value: "Replacement Parts", label: "Replacement Parts" },
    { value: "Mounting Kits", label: "Mounting Kits" },
  ],
  "Spare Parts": [
    { value: "Electrical Parts", label: "Electrical Parts" },
    { value: "Mechanical Parts", label: "Mechanical Parts" },
    { value: "Control Components", label: "Control Components" },
  ],
};

const buildEmptyAttributes = (): AttributeRow[] =>
  Array.from({ length: 5 }, () => ({ spec: "", detail: "" }));

const INITIAL_STATE: WizardState = {
  category: "",
  sub_category: "",
  name: "",
  assignedOem: "",
  manufacturing_country: "",
  condition: "",
  description: "",
  availability_status: "",
  quantityAvailable: "",
  installation_time_value: "",
  installation_time_unit: "days",
  delivery_time_value: "",
  delivery_time_unit: "days",
  industryAttributes: buildEmptyAttributes(),
  otherAttributes: buildEmptyAttributes(),
  pricing_type: "",
  pricePerUnit: "",
  unit_of_measure: "",
  return_policy: "",
  sku: "",
  video_link: "",
};

const normalizeText = (value: string): string => value.trim();

const formatDuration = (value: string, unit: DurationUnit): string | undefined => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return undefined;
  }

  return `${normalizedValue} ${unit}`;
};

const isPositiveWholeNumber = (value: string): boolean =>
  /^[1-9]\d*$/.test(normalizeText(value));

const isValidVideoUrl = (value: string): boolean => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return true;
  }

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const normalizeAttributeRows = (rows: AttributeRow[]): AttributeRow[] =>
  rows
    .map((row) => ({
      spec: normalizeText(row.spec),
      detail: normalizeText(row.detail),
    }))
    .filter((row) => row.spec || row.detail);

const mapAttributeRowsForPayload = (rows: AttributeRow[]) =>
  normalizeAttributeRows(rows).map((row) => ({
    spec: row.spec,
    detail: row.detail,
  }));

function StepNavigation({
  currentStep,
}: {
  currentStep: StepId;
}) {
  return (
    <aside className="card space-y-5 p-4 md:p-5 xl:min-h-[560px]">
      {STEPS.map((step) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <div
            key={step.id}
            className={`flex items-center gap-3 text-sm ${
              isActive || isCompleted ? "text-[#0669D9]" : "text-gray3"
            }`}
          >
            <span className="inline-flex size-5 items-center justify-center">
              {isCompleted ? (
                <CheckSquare size={16} />
              ) : (
                <span
                  className={`inline-flex size-4 items-center justify-center rounded-sm border ${
                    isActive ? "border-[#0669D9]" : "border-gray4"
                  }`}
                >
                  {isActive ? <Check size={12} /> : null}
                </span>
              )}
            </span>
            <span>{step.navLabel}</span>
          </div>
        );
      })}
    </aside>
  );
}

function AttributeTable({
  title,
  rows,
  error,
  onChange,
  onAddRow,
  onRemoveRow,
}: {
  title: string;
  rows: AttributeRow[];
  error?: string;
  onChange: (index: number, field: AttributeRowField, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-sm font-medium text-gray1">{title}</h5>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          onClick={onAddRow}
        >
          <Plus size={12} />
          Add row
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray5">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] bg-gray7 text-sm font-medium text-gray2">
          <div className="px-4 py-3">Specifications</div>
          <div className="px-4 py-3">Details</div>
          <div className="px-4 py-3" />
        </div>

        {rows.map((row, index) => (
          <div
            key={`${title}-${index}`}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] border-t border-gray5"
          >
            <input
              type="text"
              value={row.spec}
              onChange={(event) => onChange(index, "spec", event.target.value)}
              placeholder="Enter specification"
              className="min-w-0 border-none px-4 py-3 text-sm text-gray1 outline-none"
            />
            <input
              type="text"
              value={row.detail}
              onChange={(event) => onChange(index, "detail", event.target.value)}
              placeholder="Enter details"
              className="min-w-0 border-l border-gray5 px-4 py-3 text-sm text-gray1 outline-none"
            />
            <button
              type="button"
              onClick={() => onRemoveRow(index)}
              className="flex items-center justify-center border-l border-gray5 text-gray3 hover:text-danger"
              aria-label={`Remove ${title} row ${index + 1}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function MergedDurationField({
  id,
  label,
  value,
  unit,
  valueError,
  unitError,
  onValueChange,
  onUnitChange,
}: {
  id: string;
  label: string;
  value: string;
  unit: DurationUnit;
  valueError?: string;
  unitError?: string;
  onValueChange: (v: string) => void;
  onUnitChange: (u: DurationUnit) => void;
}) {
  const hasError = !!(valueError || unitError);

  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="block pl-3 text-gray1">
        {label}
      </label>
      <div
        className={cn(
          "flex h-12 min-h-12 w-full overflow-hidden rounded-xl border bg-transparent transition-colors focus-within:border-gray2",
          hasError ? "border-danger" : "border-gray5"
        )}
      >
        <input
          id={id}
          type="number"
          min={1}
          placeholder="Enter count"
          value={value}
          aria-invalid={hasError}
          onChange={(event) => onValueChange(event.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm text-gray1 outline-none placeholder:text-gray4 focus:ring-0 disabled:cursor-not-allowed disabled:bg-gray7"
        />
        <div className="w-px shrink-0 self-stretch bg-gray5" aria-hidden />
        <Select value={unit} onValueChange={(v) => onUnitChange(v as DurationUnit)}>
          <SelectTrigger
            aria-label={`${label} unit`}
            aria-invalid={hasError}
            className={cn(
              "h-12 min-h-12 w-[140px] shrink-0 rounded-none rounded-r-xl border-0 bg-transparent px-3 text-sm text-gray1 shadow-none outline-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "data-[size=default]:h-12 data-[size=default]:min-h-12"
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              {DURATION_UNIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {valueError || unitError ? (
        <div className="mt-1 space-y-0.5">
          {valueError ? <p className="text-sm text-danger">{valueError}</p> : null}
          {unitError ? <p className="text-sm text-danger">{unitError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export default function AddNewProduct() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const certificationInputRef = useRef<HTMLInputElement>(null);
  const devOemAutoPickDoneRef = useRef(false);

  const { data: authData } = useAppSelector((state) => state.auth);
  const {
    categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    message: categoriesMessage,
  } = useAppSelector((state) => state.category);
  const {
    users: oemUsers,
    loading: oemUsersLoading,
    error: oemUsersError,
  } = useAppSelector((state) => state.user);

  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [form, setForm] = useState<WizardState>(INITIAL_STATE);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [restoredToImageStep, setRestoredToImageStep] = useState(false);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [defaultImageIndex, setDefaultImageIndex] = useState(0);
  const [certificationFile, setCertificationFile] = useState<File | null>(null);

  useEffect(() => {
    if (categories.length === 0 && !categoriesLoading) {
      dispatch(fetchCategories({ page: 1, limit: 50 }));
    }
  }, [categories.length, categoriesLoading, dispatch]);

  useEffect(() => {
    dispatch(fetchPublicProfiles({ page: 1, limit: 50, roles: [UserRole.OEM] }));
  }, [dispatch]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) {
      setHasHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        currentStep?: StepId;
        form?: Partial<WizardState>;
      };
      const savedForm = parsed.form;
      if (savedForm) {
        setForm((prev) => ({
          ...prev,
          ...savedForm,
          industryAttributes:
            savedForm.industryAttributes && savedForm.industryAttributes.length > 0
              ? savedForm.industryAttributes
              : buildEmptyAttributes(),
          otherAttributes:
            savedForm.otherAttributes && savedForm.otherAttributes.length > 0
              ? savedForm.otherAttributes
              : buildEmptyAttributes(),
        }));
      }

      if (
        parsed.currentStep &&
        parsed.currentStep >= 1 &&
        parsed.currentStep <= STEPS.length
      ) {
        setCurrentStep(parsed.currentStep);
        setRestoredToImageStep(parsed.currentStep === 5);
      }
    } catch {
      window.sessionStorage.removeItem(WIZARD_STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({
        currentStep,
        form,
      }),
    );
  }, [currentStep, form, hasHydrated]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.name,
        label: category.name,
      })),
    [categories],
  );

  const subCategoryOptions = useMemo(
    () => SUB_CATEGORY_OPTIONS[form.category] ?? [],
    [form.category],
  );

  const sortedOemUsers = useMemo(() => {
    const list = [...oemUsers];
    list.sort((a, b) => {
      const da = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
      const db = `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim();
      const rank = (d: string) => (d === PLAYWRIGHT_OEM_DISPLAY_LABEL ? 0 : 1);
      if (rank(da) !== rank(db)) return rank(da) - rank(db);
      return da.localeCompare(db);
    });
    return list;
  }, [oemUsers]);

  const oemOptions = useMemo(
    () => [
      { value: "__no-oem__", label: "No OEM selected" },
      ...sortedOemUsers.map((user) => ({
        value: user._id,
        label:
          `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
          "OEM account",
      })),
    ],
    [sortedOemUsers],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!hasHydrated || devOemAutoPickDoneRef.current) return;
    if (sortedOemUsers.length === 0) return;

    setForm((prev) => {
      if (prev.assignedOem) {
        devOemAutoPickDoneRef.current = true;
        return prev;
      }
      const match = sortedOemUsers.find(
        (u) =>
          `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ===
          PLAYWRIGHT_OEM_DISPLAY_LABEL,
      );
      devOemAutoPickDoneRef.current = true;
      return match ? { ...prev, assignedOem: match._id } : prev;
    });
  }, [hasHydrated, sortedOemUsers]);

  const categoryLoadError = useMemo(() => {
    if (categoriesLoading) {
      return "";
    }

    if (categoriesError) {
      return (
        categoriesMessage ||
        "Unable to load categories. Product creation is blocked until categories are available."
      );
    }

    if (categories.length === 0) {
      return "No categories are configured yet. Product creation is blocked until categories are available.";
    }

    return "";
  }, [categories.length, categoriesError, categoriesLoading, categoriesMessage]);

  const clearFieldError = (field: FieldErrorKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setField = <T extends keyof WizardState>(field: T, value: WizardState[T]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field as FieldErrorKey);
    setSubmitError("");
  };

  const setAttributeField = (
    group: AttributeGroup,
    index: number,
    field: AttributeRowField,
    value: string,
  ) => {
    setForm((prev) => {
      const rows = [...prev[group]];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, [group]: rows };
    });
    clearFieldError(group);
  };

  const addAttributeRow = (group: AttributeGroup) => {
    setForm((prev) => ({
      ...prev,
      [group]: [...prev[group], { spec: "", detail: "" }],
    }));
  };

  const removeAttributeRow = (group: AttributeGroup, index: number) => {
    setForm((prev) => {
      const rows = prev[group].filter((_, rowIndex) => rowIndex !== index);
      return {
        ...prev,
        [group]: rows.length > 0 ? rows : [{ spec: "", detail: "" }],
      };
    });
  };

  const applyDescriptionFormat = (
    action: "bold" | "underline" | "bullet" | "numbered",
  ) => {
    const input = descriptionRef.current;
    if (!input) {
      return;
    }

    const selectionStart = input.selectionStart ?? form.description.length;
    const selectionEnd = input.selectionEnd ?? form.description.length;
    const selectedText = form.description.slice(selectionStart, selectionEnd);

    let replacement = selectedText;

    switch (action) {
      case "bold":
        replacement = selectedText ? `**${selectedText}**` : "****";
        break;
      case "underline":
        replacement = selectedText ? `__${selectedText}__` : "____";
        break;
      case "bullet":
        replacement = selectedText
          ? selectedText
              .split("\n")
              .map((line) => (line.trim() ? `- ${line}` : "- "))
              .join("\n")
          : "- ";
        break;
      case "numbered":
        replacement = selectedText
          ? selectedText
              .split("\n")
              .map((line, index) => `${index + 1}. ${line || ""}`)
              .join("\n")
          : "1. ";
        break;
      default:
        break;
    }

    const nextDescription =
      form.description.slice(0, selectionStart) +
      replacement +
      form.description.slice(selectionEnd);

    setField("description", nextDescription);

    requestAnimationFrame(() => {
      input.focus();
      const nextCursor = selectionStart + replacement.length;
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    const availableSlots = Math.max(0, MAX_PRODUCT_IMAGE_COUNT - images.length);
    const acceptedImages = selectedFiles.filter(
      (file) =>
        file.type.startsWith("image/") && file.size <= MAX_UPLOAD_FILE_SIZE,
    );

    if (acceptedImages.length === 0) {
      setFieldErrors((prev) => ({
        ...prev,
        images: "Images must be PNG or JPG files under 5 MB each.",
      }));
      event.target.value = "";
      return;
    }

    const nextImages = acceptedImages.slice(0, availableSlots);
    if (nextImages.length === 0) {
      setFieldErrors((prev) => ({
        ...prev,
        images: `You can upload a maximum of ${MAX_PRODUCT_IMAGE_COUNT} product images.`,
      }));
      event.target.value = "";
      return;
    }

    setImages((prev) => [...prev, ...nextImages]);
    setImagePreviews((prev) => [
      ...prev,
      ...nextImages.map((file) => URL.createObjectURL(file)),
    ]);
    clearFieldError("images");
    setSubmitError("");
    setRestoredToImageStep(false);
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    const nextImages = images.filter((_, imageIndex) => imageIndex !== index);
    const nextPreviews = imagePreviews.filter((_, imageIndex) => imageIndex !== index);
    setImages(nextImages);
    setImagePreviews(nextPreviews);
    setDefaultImageIndex((currentIndex) => {
      if (nextImages.length === 0) {
        return 0;
      }

      if (index === currentIndex) {
        return 0;
      }

      if (index < currentIndex) {
        return currentIndex - 1;
      }

      return Math.min(currentIndex, nextImages.length - 1);
    });

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleCertification = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const lowerFileName = file.name.toLowerCase();
    const isAllowedType = CERTIFICATION_EXTENSIONS.some((extension) =>
      lowerFileName.endsWith(extension),
    );

    if (!isAllowedType || file.size > MAX_UPLOAD_FILE_SIZE) {
      setFieldErrors((prev) => ({
        ...prev,
        certifications: "Certification must be a PDF, DOCX, or PNG file under 5 MB.",
      }));
      if (certificationInputRef.current) {
        certificationInputRef.current.value = "";
      }
      return;
    }

    setCertificationFile(file);
    clearFieldError("certifications");
    setSubmitError("");
  };

  const validateStep = (step: StepId): Partial<Record<FieldErrorKey, string>> => {
    const nextErrors: Partial<Record<FieldErrorKey, string>> = {};

    if (step === 1) {
      if (categoryLoadError) {
        nextErrors.category = categoryLoadError;
      } else if (!normalizeText(form.category)) {
        nextErrors.category = "Select a category to continue.";
      }

      return nextErrors;
    }

    if (step === 2) {
      if (!normalizeText(form.name)) {
        nextErrors.name = "Enter the product name.";
      } else if (!PRODUCT_NAME_REGEX.test(normalizeText(form.name))) {
        nextErrors.name =
          "Product name must be 3-120 characters and may only include letters, numbers, spaces, and simple punctuation.";
      }

      if (!normalizeText(form.manufacturing_country)) {
        nextErrors.manufacturing_country = "Select the manufacturing country.";
      }

      if (!form.condition) {
        nextErrors.condition = "Select the product condition.";
      }

      if (!normalizeText(form.description)) {
        nextErrors.description = "Enter the product description.";
      } else if (DESCRIPTION_FORBIDDEN_CHARS.test(form.description)) {
        nextErrors.description = "Description cannot contain < or > characters.";
      }

      return nextErrors;
    }

    if (step === 3) {
      if (!form.availability_status) {
        nextErrors.availability_status = "Select the availability status.";
      }

      if (
        form.quantityAvailable !== "" &&
        (!isPositiveWholeNumber(form.quantityAvailable) || Number(form.quantityAvailable) < 0)
      ) {
        nextErrors.quantityAvailable = "Enter a valid whole number (0 or more).";
      }

      if (!isPositiveWholeNumber(form.installation_time_value)) {
        nextErrors.installation_time_value = "Enter a valid installation time.";
      }

      if (!form.installation_time_unit) {
        nextErrors.installation_time_unit = "Select the installation time unit.";
      }

      if (!isPositiveWholeNumber(form.delivery_time_value)) {
        nextErrors.delivery_time_value = "Enter a valid delivery time.";
      }

      if (!form.delivery_time_unit) {
        nextErrors.delivery_time_unit = "Select the delivery time unit.";
      }

      return nextErrors;
    }

    if (step === 4) {
      if (!form.pricing_type) {
        nextErrors.pricing_type = "Select the pricing type.";
      }

      const priceValue = Number(form.pricePerUnit);
      if (!normalizeText(form.pricePerUnit)) {
        nextErrors.pricePerUnit = "Enter the price per unit.";
      } else if (!Number.isFinite(priceValue) || priceValue < 0) {
        nextErrors.pricePerUnit = "Price per unit must be zero or higher.";
      }

      if (!normalizeText(form.unit_of_measure)) {
        nextErrors.unit_of_measure = "Select the unit of measure.";
      }

      if (normalizeText(form.sku) && !SKU_REGEX.test(normalizeText(form.sku))) {
        nextErrors.sku =
          "SKU may only include letters, numbers, spaces, dashes, underscores, slashes, and periods.";
      }

      return nextErrors;
    }

    if (step === 5) {
      if (images.length === 0) {
        nextErrors.images = "Upload at least one product image before submitting.";
      }

      if (!isValidVideoUrl(form.video_link)) {
        nextErrors.video_link = "Enter a valid video URL or leave the field empty.";
      }

      return nextErrors;
    }

    return nextErrors;
  };

  const goToNextStep = () => {
    const nextErrors = validateStep(currentStep);
    setFieldErrors((prev) => ({ ...prev, ...nextErrors }));

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setCurrentStep((prev) => (prev >= 5 ? 5 : ((prev + 1) as StepId)));
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => (prev <= 1 ? 1 : ((prev - 1) as StepId)));
  };

  const handleSubmit = async () => {
    const nextErrors = validateStep(5);
    setFieldErrors((prev) => ({ ...prev, ...nextErrors }));

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const token = authData?.tokens?.accessToken;
    if (!token) {
      setSubmitError("You must be signed in to create a product.");
      return;
    }

    const formData = new FormData();
    formData.append("name", normalizeText(form.name));
    formData.append("category", form.category);

    if (normalizeText(form.sub_category)) {
      formData.append("sub_category", normalizeText(form.sub_category));
    }

    if (form.assignedOem && form.assignedOem !== "__no-oem__") {
      formData.append("assignedOem", form.assignedOem);
    }

    formData.append("manufacturing_country", form.manufacturing_country);
    formData.append("condition", form.condition);
    formData.append("description", normalizeText(form.description));
    formData.append("availability_status", form.availability_status);

    if (form.quantityAvailable !== "") {
      formData.append("quantityAvailable", String(Number(form.quantityAvailable)));
    }

    formData.append(
      "installation_time",
      formatDuration(form.installation_time_value, form.installation_time_unit) ?? "",
    );
    formData.append(
      "delivery_time",
      formatDuration(form.delivery_time_value, form.delivery_time_unit) ?? "",
    );
    formData.append("pricePerUnit", String(Number(form.pricePerUnit)));
    formData.append("pricing_type", form.pricing_type);
    formData.append("unit_of_measure", form.unit_of_measure);

    if (normalizeText(form.return_policy)) {
      formData.append("return_policy", normalizeText(form.return_policy));
    }

    if (normalizeText(form.sku)) {
      formData.append("sku", normalizeText(form.sku));
    }

    if (normalizeText(form.video_link)) {
      formData.append("video_link", normalizeText(form.video_link));
    }

    const industrySpecific = mapAttributeRowsForPayload(form.industryAttributes);
    const otherAttributes = mapAttributeRowsForPayload(form.otherAttributes);

    if (industrySpecific.length > 0 || otherAttributes.length > 0) {
      formData.append(
        "key_attributes",
        JSON.stringify({
          industry_specific: industrySpecific,
          other: otherAttributes,
        }),
      );
    }

    images.forEach((image) => formData.append("images", image));
    formData.append(
      "defaultImageIndex",
      String(Math.min(defaultImageIndex, images.length - 1)),
    );

    if (certificationFile) {
      formData.append("certifications", certificationFile);
    }

    setIsSubmitting(true);
    setSubmitError("");

    let createdProductId = "";

    try {
      const created = await dispatch(
        createNewProduct({ token, productData: formData }),
      ).unwrap();
      createdProductId = created.data._id;

      await dispatch(
        submitProductById({ token, id: createdProductId }),
      ).unwrap();

      setSuccessOpen(true);
      dispatch(resetProducts());

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(WIZARD_STORAGE_KEY);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit the product.";

      if (createdProductId) {
        setSubmitError(
          `${message} The product was created but could not be submitted for review.`,
        );
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepDefinition = STEPS.find((step) => step.id === currentStep) ?? STEPS[0];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header
        title="Product Listings"
        description="Create, view and edit all listed products"
      />

      <div className="space-y-4 p-4 md:p-6">
        <Link
          href="/dashboard/distributor/catalogue"
          className="inline-flex items-center gap-2 text-sm text-gray2 hover:text-primary"
        >
          <ArrowLeft size={14} />
          Go Back
        </Link>

        <section className="card space-y-2">
          <h2 className="medium3 text-gray1">Add New Product</h2>
          <p className="text-sm text-gray3">
            Kindly provide all required information and submit, to add a new product
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
          <StepNavigation currentStep={currentStep} />

          <div className="card space-y-6 p-4 md:p-6">
            <div>
              <h3 className="medium3 text-gray1">{currentStepDefinition.panelTitle}</h3>
              <p className="text-sm text-gray3">
                {currentStepDefinition.panelDescription}
              </p>
            </div>

            {categoryLoadError ? (
              <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                {categoryLoadError}
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <SingleSelect
                  label="Category"
                  placeholder={categoriesLoading ? "Loading categories..." : "Select category"}
                  value={form.category}
                  options={categoryOptions}
                  disabled={Boolean(categoryLoadError)}
                  error={fieldErrors.category}
                  onValueChange={(value) => {
                    setField("category", value);
                    setField("sub_category", "");
                  }}
                />

                <SingleSelect
                  label="Sub-category"
                  placeholder={
                    form.category
                      ? subCategoryOptions.length > 0
                        ? "Select category"
                        : "No sub-categories available"
                      : "Select category first"
                  }
                  value={form.sub_category}
                  options={subCategoryOptions}
                  disabled={!form.category || subCategoryOptions.length === 0}
                  error={fieldErrors.sub_category}
                  onValueChange={(value) => setField("sub_category", value)}
                />
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    label="Product name"
                    placeholder="Enter name of product"
                    value={form.name}
                    error={fieldErrors.name}
                    onChange={(event) => setField("name", event.target.value)}
                  />

                  <SingleSelect
                    label="Brand/OEM"
                    placeholder={oemUsersLoading ? "Loading OEMs..." : "Select option"}
                    value={form.assignedOem || undefined}
                    options={oemOptions}
                    error={fieldErrors.assignedOem}
                    onValueChange={(value) =>
                      setField("assignedOem", value === "__no-oem__" ? "" : value)
                    }
                  />

                  <SingleSelect
                    label="Manufacturing country"
                    placeholder="Select country"
                    value={form.manufacturing_country}
                    options={COUNTRY_OPTIONS}
                    error={fieldErrors.manufacturing_country}
                    onValueChange={(value) => setField("manufacturing_country", value)}
                  />

                  <SingleSelect
                    label="Condition"
                    placeholder="Select option"
                    value={form.condition}
                    options={CONDITION_OPTIONS}
                    error={fieldErrors.condition}
                    onValueChange={(value) => setField("condition", value as Condition)}
                  />
                </div>

                {oemUsersError ? (
                  <p className="text-sm text-warning">
                    OEM profiles could not be loaded. You can still create the listing without assigning an OEM.
                  </p>
                ) : null}

                <div className="space-y-2">
                  <label className="block pl-3 text-sm text-gray1">
                    Product Description
                  </label>
                  <div className="overflow-hidden rounded-xl border border-gray5">
                    <div className="flex flex-wrap items-center gap-2 border-b border-gray5 bg-gray7 px-3 py-2">
                      <button
                        type="button"
                        className="text-gray2 hover:text-primary"
                        onClick={() => applyDescriptionFormat("bold")}
                        aria-label="Add bold markers"
                      >
                        <Bold size={14} />
                      </button>
                      <button
                        type="button"
                        className="text-gray2 hover:text-primary"
                        onClick={() => applyDescriptionFormat("underline")}
                        aria-label="Add underline markers"
                      >
                        <Underline size={14} />
                      </button>
                      <button
                        type="button"
                        className="text-gray2 hover:text-primary"
                        onClick={() => applyDescriptionFormat("bullet")}
                        aria-label="Add bullet list markers"
                      >
                        <List size={14} />
                      </button>
                      <button
                        type="button"
                        className="text-gray2 hover:text-primary"
                        onClick={() => applyDescriptionFormat("numbered")}
                        aria-label="Add numbered list markers"
                      >
                        <ListOrdered size={14} />
                      </button>
                    </div>
                    <Textarea
                      ref={descriptionRef}
                      label=""
                      value={form.description}
                      placeholder="Enter specs here..."
                      error={fieldErrors.description}
                      onChange={(event) => setField("description", event.target.value)}
                      className="min-h-[220px] border-none focus:border-none"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3 md:items-start">
                  <SingleSelect
                    label="Availability status"
                    placeholder="Select option"
                    value={form.availability_status}
                    options={AVAILABILITY_OPTIONS}
                    error={fieldErrors.availability_status}
                    className="!h-12 !min-h-12 !py-3"
                    onValueChange={(value) =>
                      setField("availability_status", value as AvailabilityStatus)
                    }
                  />

                  <Input
                    label="Quantity in stock"
                    placeholder="Enter quantity"
                    type="number"
                    min={0}
                    value={form.quantityAvailable}
                    error={fieldErrors.quantityAvailable}
                    onChange={(event) =>
                      setField("quantityAvailable", event.target.value)
                    }
                  />

                  <MergedDurationField
                    id="installation_time_value"
                    label="Installation Time"
                    value={form.installation_time_value}
                    unit={form.installation_time_unit}
                    valueError={fieldErrors.installation_time_value}
                    unitError={fieldErrors.installation_time_unit}
                    onValueChange={(v) => setField("installation_time_value", v)}
                    onUnitChange={(u) => setField("installation_time_unit", u)}
                  />

                  <MergedDurationField
                    id="delivery_time_value"
                    label="Delivery time"
                    value={form.delivery_time_value}
                    unit={form.delivery_time_unit}
                    valueError={fieldErrors.delivery_time_value}
                    unitError={fieldErrors.delivery_time_unit}
                    onValueChange={(v) => setField("delivery_time_value", v)}
                    onUnitChange={(u) => setField("delivery_time_unit", u)}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray1">Key Attributes</h4>

                  <AttributeTable
                    title="Industrial-Specific Attributes"
                    rows={form.industryAttributes}
                    error={fieldErrors.industryAttributes}
                    onAddRow={() => addAttributeRow("industryAttributes")}
                    onRemoveRow={(index) => removeAttributeRow("industryAttributes", index)}
                    onChange={(index, field, value) =>
                      setAttributeField("industryAttributes", index, field, value)
                    }
                  />

                  <AttributeTable
                    title="Other Attributes"
                    rows={form.otherAttributes}
                    error={fieldErrors.otherAttributes}
                    onAddRow={() => addAttributeRow("otherAttributes")}
                    onRemoveRow={(index) => removeAttributeRow("otherAttributes", index)}
                    onChange={(index, field, value) =>
                      setAttributeField("otherAttributes", index, field, value)
                    }
                  />
                </div>
              </div>
            ) : null}

            {currentStep === 4 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <SingleSelect
                    label="Pricing type"
                    placeholder="Select option"
                    value={form.pricing_type}
                    options={PRICING_TYPE_OPTIONS}
                    error={fieldErrors.pricing_type}
                    onValueChange={(value) =>
                      setField("pricing_type", value as PricingType)
                    }
                  />

                  <Input
                    label="Price per unit"
                    placeholder="Enter amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.pricePerUnit}
                    error={fieldErrors.pricePerUnit}
                    onChange={(event) => setField("pricePerUnit", event.target.value)}
                  />

                  <SingleSelect
                    label="Unit of measure"
                    placeholder="Select option"
                    value={form.unit_of_measure}
                    options={UNIT_OF_MEASURE_OPTIONS}
                    error={fieldErrors.unit_of_measure}
                    onValueChange={(value) => setField("unit_of_measure", value)}
                  />
                </div>

                <Textarea
                  label="Return policy (optional)"
                  placeholder="Enter text here..."
                  value={form.return_policy}
                  error={fieldErrors.return_policy}
                  onChange={(event) => setField("return_policy", event.target.value)}
                  className="min-h-[120px]"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="SKU (Optional)"
                    placeholder="Enter SKU"
                    value={form.sku}
                    error={fieldErrors.sku}
                    onChange={(event) => setField("sku", event.target.value)}
                  />

                  <div className="space-y-2">
                    <label className="block pl-3 text-sm text-gray1">
                      Certifications (optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => certificationInputRef.current?.click()}
                      className="flex min-h-[84px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray5 bg-white px-4 py-4 text-center hover:border-primary"
                    >
                      <FileText size={20} className="mb-2 text-gray3" />
                      <span className="text-sm text-gray2">
                        <span className="text-[#FE6E00]">Click here</span> to upload file
                      </span>
                      <span className="mt-1 text-xs text-gray3">
                        Allowed format - DOCX, PNG, PDF
                      </span>
                    </button>
                    <input
                      ref={certificationInputRef}
                      type="file"
                      accept=".docx,.png,.pdf"
                      className="hidden"
                      onChange={handleCertification}
                    />
                    {certificationFile ? (
                      <div className="flex items-center justify-between rounded-xl bg-gray7 px-4 py-3 text-sm">
                        <span className="truncate text-gray1">{certificationFile.name}</span>
                        <button
                          type="button"
                          className="text-gray3 hover:text-danger"
                          onClick={() => {
                            setCertificationFile(null);
                            clearFieldError("certifications");
                            if (certificationInputRef.current) {
                              certificationInputRef.current.value = "";
                            }
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : null}
                    {fieldErrors.certifications ? (
                      <p className="text-sm text-danger">{fieldErrors.certifications}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep === 5 ? (
              <div className="space-y-5">
                <Input
                  label="Product video link (eg YouTube link, If available)"
                  placeholder="Enter link"
                  value={form.video_link}
                  error={fieldErrors.video_link}
                  onChange={(event) => setField("video_link", event.target.value)}
                />

                <div className="space-y-3">
                  <label className="block pl-3 text-sm text-gray1">Upload images</label>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex min-h-[140px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray5 bg-white px-4 py-6 text-center hover:border-primary"
                  >
                    <Upload size={24} className="mb-2 text-gray3" />
                    <span className="text-sm text-gray2">
                      <span className="text-[#FE6E00]">Click here</span> to upload file
                    </span>
                    <span className="mt-1 text-xs text-gray3">Allowed format - PNG, JPG</span>
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    className="hidden"
                    onChange={handleImages}
                  />

                  {restoredToImageStep && imagePreviews.length === 0 ? (
                    <p className="text-xs text-gray3">
                      Your progress was restored after refresh. Please re-attach product images before submitting.
                    </p>
                  ) : null}

                  {fieldErrors.images ? (
                    <p className="text-sm text-danger">{fieldErrors.images}</p>
                  ) : null}
                </div>

                {imagePreviews.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray1">Uploaded images</p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={`${preview}-${index}`} className="space-y-2">
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preview}
                              alt={`Uploaded preview ${index + 1}`}
                              className="size-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-gray2"
                              onClick={() => removeImage(index)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <label className="flex items-center gap-2 text-xs text-gray2">
                            <input
                              type="radio"
                              name="default-product-image"
                              checked={index === defaultImageIndex}
                              onChange={() => setDefaultImageIndex(index)}
                            />
                            Use this image as your default image option
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-gray5 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                title="Back"
                variant="secondaryLight"
                size="md"
                iconLeft={<ArrowLeft size={14} />}
                onClick={goToPreviousStep}
                className={currentStep === 1 ? "invisible" : "w-full sm:w-auto"}
              />

              {currentStep < 5 ? (
                <Button
                  title="Save & Continue"
                  size="md"
                  iconRight={<ArrowRight size={14} />}
                  onClick={goToNextStep}
                  disabled={Boolean(categoryLoadError) && currentStep === 1}
                  className="w-full sm:w-auto sm:min-w-[196px]"
                />
              ) : (
                <Button
                  title={isSubmitting ? "Submitting..." : "Submit"}
                  size="md"
                  iconRight={!isSubmitting ? <ArrowRight size={14} /> : undefined}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto sm:min-w-[196px]"
                />
              )}
            </div>
          </div>
        </section>
      </div>

      <PopUp
        open={successOpen}
        type="success"
        title="Congratulations"
        description="Your submission was successful. Please hold on while it is been reviewed"
        primaryButtonText="Okay"
        onClose={() => setSuccessOpen(false)}
        onPrimaryAction={() => {
          setSuccessOpen(false);
          router.push("/dashboard/distributor/catalogue");
        }}
      />
    </div>
  );
}
