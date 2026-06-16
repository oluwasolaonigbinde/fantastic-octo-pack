"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  ChevronDown,
  ImagePlus,
} from "lucide-react";

import Header from "../../../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

type StepKey = "category" | "basic" | "stock" | "pricing" | "images";

const steps: Array<{ key: StepKey; label: string; title: string }> = [
  { key: "category", label: "Product category", title: "Product Category" },
  { key: "basic", label: "Product basic info", title: "Product Basic Info" },
  { key: "stock", label: "Stock & Availability", title: "Stock & Availability" },
  { key: "pricing", label: "Pricing", title: "Pricing information" },
  { key: "images", label: "Image upload", title: "Product Images" },
];

export default function AgentBusinessOwnerAddProductPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const stepFromQuery = searchParams.get("step") as StepKey | null;
  const state = searchParams.get("state");
  const activeStep = steps.some((step) => step.key === stepFromQuery)
    ? stepFromQuery
    : "category";
  const activeStepIndex = steps.findIndex((step) => step.key === activeStep);
  const active = steps[activeStepIndex];

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header
        title="Business Owners"
        description="Wednesday 10th September, 2025"
      />
      {state === "error" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
          <div
            data-testid="submission-error-modal"
            className="w-[400px] rounded-[28px] border-2 border-[#0669D9] bg-white px-10 py-9"
          >
            <div className="rounded-xl border border-[#FFD6C2] bg-[#FFFDFC] p-4">
              <AlertCircle size={28} className="text-[#FE6E00]" />
              <h2 className="mt-4 text-base font-medium text-[#111827]">
                Sorry, submission failed.
              </h2>
              <Link
                href={`/dashboard/agent/business-owners/${params.id}/catalogue/new?step=${activeStep}`}
                className="mt-4 inline-flex text-sm font-medium text-[#FE6E00]"
              >
                Click here to try again
              </Link>
            </div>
            <Link
              href={`/dashboard/agent/business-owners/${params.id}/catalogue`}
              className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-xl border border-[#0669D9] bg-[#EAF9FF] text-sm font-medium text-[#03265C]"
            >
              Cancel
            </Link>
          </div>
        </div>
      ) : null}

      <main className="min-h-[calc(100vh-100px)] space-y-4 bg-[#F5F7FA] p-5 md:p-6">
        <Link
          href={`/dashboard/agent/business-owners/${params.id}/catalogue`}
          className="inline-flex items-center gap-2 text-sm text-[#374151] hover:text-[#0669D9]"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <section className="rounded-xl border border-[#DDE2EA] bg-white px-5 py-7">
          <div>
            <h1 className="text-xl font-semibold text-[#111827]">
              Add New Product
            </h1>
            <p className="mt-2 text-sm text-[#111827]">
              Kindly provide all required information and submit, to add a new product
            </p>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[278px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-[#DDE2EA] bg-white p-5">
            <nav className="space-y-9">
              {steps.map((step) => {
                const isActive = step.key === activeStep;
                return (
                  <Link
                    key={step.key}
                    href={`/dashboard/agent/business-owners/${params.id}/catalogue/new?step=${step.key}`}
                    className={`flex items-center gap-4 text-base ${
                      isActive ? "text-[#0669D9]" : "text-[#6B7280]"
                    }`}
                  >
                    <CheckSquare
                      size={20}
                      className={isActive ? "text-[#0669D9]" : "text-[#6B7280]"}
                    />
                    {step.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="rounded-xl border border-[#DDE2EA] bg-white px-5 py-7">
            <h2 className="text-xl font-semibold text-[#111827]">
              {active.title}
            </h2>
            <p className="mt-2 text-sm text-[#111827]">
              {activeStep === "category"
                ? "Provide the correct information about the product category"
                : "Provide the correct information about the product"}
            </p>

            <div className="mt-10">
              {activeStep === "category" ? (
                <div className="space-y-7">
                  <div className="grid max-w-[520px] gap-5 sm:grid-cols-2">
                    <SelectBox label="Category" placeholder="Select category" />
                    <SelectBox label="Sub-category" placeholder="Select category" />
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#111827]">
                      Manual sub-category (optional)
                    </span>
                    <textarea
                      placeholder="Enter text here..."
                      className="h-[100px] w-full resize-none rounded-xl border border-[#DDE2EA] px-4 py-4 text-sm outline-none placeholder:text-[#B8C0CC] focus:ring-2 focus:ring-[#0669D9]/30"
                    />
                  </label>
                </div>
              ) : null}

              {activeStep === "basic" ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label="Product name" placeholder="Enter product name" />
                  <Field label="Brand" placeholder="Enter brand name" />
                  <Field label="Model number" placeholder="Enter model number" />
                  <SelectBox label="Product type" placeholder="Select product type" />
                  <Field label="Product description" placeholder="Enter text here..." wide />
                </div>
              ) : null}

              {activeStep === "stock" ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label="Quantity in stock" placeholder="Enter quantity" />
                  <Field label="Minimum order quantity" placeholder="Enter minimum order" />
                  <SelectBox label="Availability status" placeholder="Available" />
                  <Field label="Restock date" placeholder="DD/MM/YYYY" />
                </div>
              ) : null}

              {activeStep === "pricing" ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label="Unit price" placeholder="Enter amount" />
                  <Field label="Discount price" placeholder="Enter amount" />
                  <Field label="Delivery fee" placeholder="Enter amount" />
                  <Field label="Commission rate" placeholder="Enter percentage" />
                </div>
              ) : null}

              {activeStep === "images" ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className="flex min-h-[150px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#DDE2EA] bg-[#F9FAFB] text-sm text-[#6B7280]"
                    >
                      <ImagePlus size={30} className="text-[#0669D9]" />
                      Upload product image
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-10">
              <button
                type="button"
                className="inline-flex h-[60px] min-w-[320px] items-center justify-center gap-3 rounded-xl bg-[#0669D9] px-6 text-base font-medium text-white"
              >
                Save & Continue
                <ArrowRight size={20} />
              </button>
            </div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function SelectBox({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm text-[#111827]">{label}</span>
      <span className="flex h-[62px] w-full items-center justify-between rounded-xl border border-[#DDE2EA] px-4 text-sm text-[#B8C0CC]">
        {placeholder}
        <ChevronDown size={18} className="text-[#6B7280]" />
      </span>
    </label>
  );
}

function Field({
  label,
  placeholder,
  wide,
}: {
  label: string;
  placeholder: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "lg:col-span-2" : ""}>
      <span className="mb-2 block text-sm text-[#111827]">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        className="h-[62px] w-full rounded-xl border border-[#DDE2EA] px-4 text-sm outline-none placeholder:text-[#B8C0CC] focus:ring-2 focus:ring-[#0669D9]/30"
      />
    </label>
  );
}
