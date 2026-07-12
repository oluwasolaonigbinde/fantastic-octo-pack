"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import { PopUp } from "@/components/base";
import { useCreateServiceRequestMutation } from "@/hooks/queries/service-requests";

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

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

interface BuyerServiceRequestFormProps {
  engineerId: string;
}

export default function BuyerServiceRequestForm({
  engineerId,
}: BuyerServiceRequestFormProps) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const createServiceRequest = useCreateServiceRequestMutation();
  const isLoading = createServiceRequest.isPending;

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

  const onSubmit = async (formData: JobRequestFormData) => {
    setErrorMessage(null);

    try {
      const location = formData.serviceLocation?.trim();

      const payload =
        selectedPhoto !== null
          ? (() => {
              const multipartData = new FormData();
              multipartData.append("jobType", formData.jobType);
              multipartData.append("equipmentName", formData.equipmentName);
              multipartData.append("model", formData.model);
              multipartData.append("preferredDate", formData.preferredDate);
              multipartData.append("preferredTime", formData.preferredTime);
              multipartData.append(
                "serviceDescription",
                formData.serviceDescription,
              );
              if (location) {
                multipartData.append("serviceLocation", location);
              }
              multipartData.append("engineerId", engineerId);
              multipartData.append("photo", selectedPhoto);
              return multipartData;
            })()
          : {
              jobType: formData.jobType,
              equipmentName: formData.equipmentName,
              model: formData.model,
              ...(location ? { serviceLocation: location } : {}),
              preferredDate: formData.preferredDate,
              preferredTime: formData.preferredTime,
              serviceDescription: formData.serviceDescription,
              engineerId,
            };

      await createServiceRequest.mutateAsync(payload);

      reset();
      setSelectedPhoto(null);
      setPhotoInputKey((current) => current + 1);
      setShowSuccess(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to create service request. Please try again.",
      );
    }
  };

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
            onClick={() => router.push("/dashboard/buyer/service-engineers")}
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
          router.push("/dashboard/buyer/service-request");
        }}
        showIcon
      />
    </section>
  );
}
