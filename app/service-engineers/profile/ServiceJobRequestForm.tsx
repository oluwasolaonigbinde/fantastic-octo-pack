"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";

import { PopUp } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { createServiceRequest } from "@/store/slices/service-request-slice";
import {
  clearPendingAuthIntent,
  readPendingAuthIntent,
  writePendingAuthIntent,
} from "@/utils/pendingAuth";

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;
const RESUME_ACTION = "request_service";

const jobRequestSchema = z.object({
  jobType: z.string().min(1, "Job type is required"),
  equipmentName: z.string().min(1, "Equipment name is required"),
  model: z.string().min(1, "Model is required"),
  serviceLocation: z
    .string()
    .max(500, "Service location must be at most 500 characters"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time"),
  serviceDescription: z
    .string()
    .min(10, "Service description must be at least 10 characters"),
});

type JobRequestFormData = z.infer<typeof jobRequestSchema>;

const JOB_TYPE_OPTIONS = [
  "Installation",
  "Repair",
  "Maintenance",
  "Calibration",
  "Inspection",
  "Other",
];

const SERVICE_REQUESTER_ROLES = new Set(["buyer", "distributor"]);

interface ServiceJobRequestFormProps {
  engineerId: string;
}

export default function ServiceJobRequestForm({
  engineerId,
}: ServiceJobRequestFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const resumeHandledRef = useRef(false);

  const authData = useAppSelector((state) => state.auth.data);
  const { isLoading } = useAppSelector((state) => state.serviceRequest);

  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JobRequestFormData>({
    resolver: zodResolver(jobRequestSchema),
    defaultValues: {
      jobType: "",
      equipmentName: "",
      model: "",
      serviceLocation: "",
      preferredDate: "",
      preferredTime: "",
      serviceDescription: "",
    },
  });

  useEffect(() => {
    const resumeAction = searchParams.get("resumeAction");
    if (resumeAction !== RESUME_ACTION || resumeHandledRef.current) {
      return;
    }

    if (
      !authData?.tokens?.accessToken ||
      !SERVICE_REQUESTER_ROLES.has(authData.role)
    ) {
      return;
    }

    const pendingIntent = readPendingAuthIntent();
    if (
      !pendingIntent ||
      pendingIntent.action !== RESUME_ACTION ||
      pendingIntent.engineerId !== engineerId ||
      !pendingIntent.serviceRequestDraft
    ) {
      resumeHandledRef.current = true;
      router.replace(`/service-engineers/profile?id=${engineerId}&view=request`);
      return;
    }

    resumeHandledRef.current = true;
    reset({
      jobType: pendingIntent.serviceRequestDraft.jobType,
      equipmentName: pendingIntent.serviceRequestDraft.equipmentName,
      model: pendingIntent.serviceRequestDraft.model,
      serviceLocation: pendingIntent.serviceRequestDraft.serviceLocation ?? "",
      preferredDate: pendingIntent.serviceRequestDraft.preferredDate,
      preferredTime: pendingIntent.serviceRequestDraft.preferredTime,
      serviceDescription: pendingIntent.serviceRequestDraft.serviceDescription,
    });
    clearPendingAuthIntent();
    router.replace(
      `/service-engineers/profile?id=${engineerId}&view=request&restored=1`,
    );
  }, [authData, engineerId, reset, router, searchParams]);

  useEffect(() => {
    if (searchParams.get("restored") !== "1") {
      return;
    }
    router.replace(`/service-engineers/profile?id=${engineerId}&view=request`);
  }, [engineerId, router, searchParams]);

  const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoError(null);

    if (!file) {
      setSelectedPhoto(null);
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setSelectedPhoto(null);
      setPhotoError("Upload a JPG or PNG file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setSelectedPhoto(null);
      setPhotoError("Photo must be 2MB or less.");
      event.target.value = "";
      return;
    }

    setSelectedPhoto(file);
  };

  const persistPendingIntent = (formData: JobRequestFormData) => {
    writePendingAuthIntent({
      action: RESUME_ACTION,
      sourcePath: `/service-engineers/profile?id=${engineerId}&view=request`,
      engineerId,
      serviceRequestDraft: {
        jobType: formData.jobType,
        equipmentName: formData.equipmentName,
        model: formData.model,
        serviceLocation: formData.serviceLocation?.trim() || undefined,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        serviceDescription: formData.serviceDescription,
      },
    });
  };

  const onSubmit = async (formData: JobRequestFormData) => {
    setErrorMessage(null);

    if (!authData?.tokens?.accessToken) {
      persistPendingIntent(formData);
      router.push("/register");
      return;
    }

    if (!SERVICE_REQUESTER_ROLES.has(authData.role)) {
      setErrorMessage(
        "Only buyer and distributor accounts can submit service requests.",
      );
      return;
    }

    try {
      const payload =
        selectedPhoto !== null
          ? (() => {
              const multipartData = new FormData();
              multipartData.append("jobType", formData.jobType);
              multipartData.append("equipmentName", formData.equipmentName);
              multipartData.append("model", formData.model);
              multipartData.append("preferredDate", formData.preferredDate);
              multipartData.append("preferredTime", formData.preferredTime);
              multipartData.append("serviceDescription", formData.serviceDescription);
              const loc = formData.serviceLocation?.trim();
              if (loc) {
                multipartData.append("serviceLocation", loc);
              }
              multipartData.append("engineerId", engineerId);
              multipartData.append("photo", selectedPhoto);
              return multipartData;
            })()
          : {
              jobType: formData.jobType,
              equipmentName: formData.equipmentName,
              model: formData.model,
              ...(formData.serviceLocation?.trim()
                ? { serviceLocation: formData.serviceLocation.trim() }
                : {}),
              preferredDate: formData.preferredDate,
              preferredTime: formData.preferredTime,
              serviceDescription: formData.serviceDescription,
              engineerId,
            };

      await dispatch(
        createServiceRequest({
          token: authData.tokens.accessToken,
          data: payload,
        }),
      ).unwrap();

      clearPendingAuthIntent();
      reset();
      setSelectedPhoto(null);
      setPhotoInputKey((current) => current + 1);
      setShowSuccess(true);
    } catch (error) {
      setErrorMessage(
        typeof error === "string"
          ? error
          : "Failed to create service request. Please try again.",
      );
    }
  };

  const showRestoredBanner = searchParams.get("restored") === "1";

  return (
    <section className="rounded-[28px] border border-[#e9eff6] bg-white px-4 py-6 shadow-[0_10px_30px_rgba(15,37,79,0.05)] md:px-8 md:py-8">
      <div>
        <h2 className="text-[20px] font-semibold text-[#163052]">
          Create Service Job Request
        </h2>
        <p className="mt-1 text-[13px] text-[#76879e]">
          Fill out the details below to request service from this engineer
        </p>
      </div>

      {showRestoredBanner ? (
        <div className="mt-4 rounded-[14px] border border-[#cfe0f5] bg-[#f5faff] px-4 py-3 text-sm text-[#174067]">
          Your request details were restored. Re-select any attachment before
          submitting.
        </div>
      ) : null}

      {errorMessage && (
        <div className="mt-4 rounded-[14px] border border-[#ffd1d1] bg-[#fff7f7] px-4 py-3 text-sm text-[#b42318]">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-[13px] font-medium text-[#5c6d84]">
            Job type*
          </label>
          <select
            {...register("jobType")}
            className="h-12 w-full rounded-[12px] border border-[#e1e9f3] px-4 text-sm text-[#1e2f49] outline-none transition focus:border-[#9ec7f2]"
            defaultValue=""
          >
            <option value="" disabled>
              Select job type
            </option>
            {JOB_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.jobType && (
            <p className="mt-1 text-xs text-[#d92d20]">{errors.jobType.message}</p>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#5c6d84]">
              Equipment name*
            </label>
            <input
              type="text"
              {...register("equipmentName")}
              placeholder="Enter equipment name"
              className="h-12 w-full rounded-[12px] border border-[#e1e9f3] px-4 text-sm text-[#1e2f49] outline-none transition focus:border-[#9ec7f2]"
            />
            {errors.equipmentName && (
              <p className="mt-1 text-xs text-[#d92d20]">
                {errors.equipmentName.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#5c6d84]">
              Model*
            </label>
            <input
              type="text"
              {...register("model")}
              placeholder="Enter model"
              className="h-12 w-full rounded-[12px] border border-[#e1e9f3] px-4 text-sm text-[#1e2f49] outline-none transition focus:border-[#9ec7f2]"
            />
            {errors.model && (
              <p className="mt-1 text-xs text-[#d92d20]">{errors.model.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-[#5c6d84]">
            Service location (optional)
          </label>
          <input
            type="text"
            {...register("serviceLocation")}
            placeholder="Hospital, city, or address"
            className="h-12 w-full rounded-[12px] border border-[#e1e9f3] px-4 text-sm text-[#1e2f49] outline-none transition focus:border-[#9ec7f2]"
          />
          {errors.serviceLocation && (
            <p className="mt-1 text-xs text-[#d92d20]">
              {errors.serviceLocation.message}
            </p>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#5c6d84]">
              Preferred date*
            </label>
            <input
              type="date"
              {...register("preferredDate")}
              className="h-12 w-full rounded-[12px] border border-[#e1e9f3] px-4 text-sm text-[#1e2f49] outline-none transition focus:border-[#9ec7f2]"
            />
            {errors.preferredDate && (
              <p className="mt-1 text-xs text-[#d92d20]">
                {errors.preferredDate.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#5c6d84]">
              Preferred time*
            </label>
            <input
              type="time"
              {...register("preferredTime")}
              className="h-12 w-full rounded-[12px] border border-[#e1e9f3] px-4 text-sm text-[#1e2f49] outline-none transition focus:border-[#9ec7f2]"
            />
            {errors.preferredTime && (
              <p className="mt-1 text-xs text-[#d92d20]">
                {errors.preferredTime.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-[#5c6d84]">
            Service description
          </label>
          <textarea
            {...register("serviceDescription")}
            rows={4}
            placeholder="Describe the work to be required."
            className="w-full rounded-[12px] border border-[#e1e9f3] px-4 py-3 text-sm text-[#1e2f49] outline-none transition focus:border-[#9ec7f2]"
          />
          {errors.serviceDescription && (
            <p className="mt-1 text-xs text-[#d92d20]">
              {errors.serviceDescription.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-[#5c6d84]">
            Photo upload (optional)
          </label>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="flex min-h-[114px] w-full max-w-[360px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#d8e3ef] bg-[#fbfdff] px-4 text-center transition hover:border-[#9ec7f2]"
          >
            <FileText size={24} className="text-[#75849b]" />
            <p className="mt-3 text-[13px] text-[#7b8ba2]">
              <span className="font-medium text-[#fe7a14]">Click here</span> to
              upload file
            </p>
            <p className="mt-1 text-[11px] text-[#9cabbc]">
              Allowed format - JPG, JPEG, PNG
            </p>
            {selectedPhoto && (
              <p className="mt-3 max-w-full truncate text-[12px] font-medium text-[#244268]">
                {selectedPhoto.name}
              </p>
            )}
          </button>
          <input
            key={photoInputKey}
            ref={photoInputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            hidden
            onChange={handlePhotoSelection}
          />
          {photoError && <p className="mt-1 text-xs text-[#d92d20]">{photoError}</p>}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              router.push(`/service-engineers/profile?id=${engineerId}&view=profile`)
            }
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#ffd8bf] bg-white px-4 text-sm font-semibold text-[#f08a3c] transition hover:bg-[#fff7f1]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#0669d9] px-4 text-sm font-semibold text-white transition hover:bg-[#0459b9] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>

      <PopUp
        open={showSuccess}
        type="success"
        title="Request Submitted"
        description="Your service job request has been submitted successfully."
        primaryButtonText="View service requests"
        onClose={() => setShowSuccess(false)}
        onPrimaryAction={() => {
          setShowSuccess(false);
          router.push(
            authData?.role === "distributor"
              ? "/dashboard/distributor/service-engineers"
              : "/dashboard/buyer/service-request",
          );
        }}
        showIcon
      />
    </section>
  );
}
