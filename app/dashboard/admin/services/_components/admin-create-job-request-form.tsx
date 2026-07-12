"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText } from "lucide-react";

import { PopUp } from "@/components/base";
import { useCreateServiceRequestMutation } from "@/hooks/queries/service-requests";
import { userService } from "@/services/userService";
import { PublicProfileData, UserRole } from "@/types/user";

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

const JOB_TYPE_OPTIONS = [
  "Installation",
  "Repair",
  "Maintenance",
  "Calibration",
  "Inspection",
  "Other",
];

const adminJobRequestSchema = z.object({
  engineerId: z.string().min(1, "Select a service engineer"),
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

type AdminJobRequestFormData = z.infer<typeof adminJobRequestSchema>;

function engineerLabel(engineer: PublicProfileData): string {
  const fullName = [engineer.firstName, engineer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || "Unnamed engineer";
}

const FIELD_CLASS =
  "h-12 w-full rounded-[12px] border border-[#e1e9f3] px-4 text-sm text-[#1e2f49] outline-none transition focus:border-[#9ec7f2]";
const LABEL_CLASS = "mb-2 block text-[13px] font-medium text-[#5c6d84]";
const ERROR_CLASS = "mt-1 text-xs text-[#d92d20]";

export default function AdminCreateJobRequestForm() {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const createServiceRequest = useCreateServiceRequestMutation();
  const isSubmitting = createServiceRequest.isPending;

  const [engineers, setEngineers] = useState<PublicProfileData[]>([]);
  const [engineersLoading, setEngineersLoading] = useState(true);
  const [engineersError, setEngineersError] = useState<string | null>(null);

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
  } = useForm<AdminJobRequestFormData>({
    resolver: zodResolver(adminJobRequestSchema),
    defaultValues: {
      engineerId: "",
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
    let isMounted = true;

    const loadEngineers = async () => {
      setEngineersLoading(true);
      setEngineersError(null);

      try {
        const response = await userService.getPublicProfiles(
          1,
          100,
          [UserRole.ENGINEER],
        );
        if (isMounted) {
          setEngineers(response.data.docs);
        }
      } catch (error) {
        if (isMounted) {
          setEngineersError(
            error instanceof Error
              ? error.message
              : "Failed to load service engineers.",
          );
        }
      } finally {
        if (isMounted) {
          setEngineersLoading(false);
        }
      }
    };

    void loadEngineers();

    return () => {
      isMounted = false;
    };
  }, []);

  const engineerOptions = useMemo(
    () =>
      engineers.map((engineer) => ({
        value: engineer._id,
        label: engineerLabel(engineer),
      })),
    [engineers],
  );

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

  const onSubmit = async (formData: AdminJobRequestFormData) => {
    setErrorMessage(null);

    try {
      const location = formData.serviceLocation?.trim();

      const payload =
        selectedPhoto !== null
          ? (() => {
              const multipartData = new FormData();
              multipartData.append("engineerId", formData.engineerId);
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
              multipartData.append("photo", selectedPhoto);
              return multipartData;
            })()
          : {
              engineerId: formData.engineerId,
              jobType: formData.jobType,
              equipmentName: formData.equipmentName,
              model: formData.model,
              ...(location ? { serviceLocation: location } : {}),
              preferredDate: formData.preferredDate,
              preferredTime: formData.preferredTime,
              serviceDescription: formData.serviceDescription,
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
          : "Failed to create the service request. Please try again.",
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
          Raise a service request on behalf of the platform and assign it to a
          service engineer.
        </p>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-[14px] border border-[#ffd1d1] bg-[#fff7f7] px-4 py-3 text-sm text-[#b42318]">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <div>
          <label className={LABEL_CLASS}>Assign service engineer*</label>
          <select
            {...register("engineerId")}
            className={FIELD_CLASS}
            defaultValue=""
            disabled={engineersLoading || engineerOptions.length === 0}
          >
            <option value="" disabled>
              {engineersLoading
                ? "Loading engineers..."
                : engineerOptions.length === 0
                  ? "No engineers available"
                  : "Select a service engineer"}
            </option>
            {engineerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {engineersError && <p className={ERROR_CLASS}>{engineersError}</p>}
          {errors.engineerId && (
            <p className={ERROR_CLASS}>{errors.engineerId.message}</p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>Job type*</label>
          <select {...register("jobType")} className={FIELD_CLASS} defaultValue="">
            <option value="" disabled>
              Select job type
            </option>
            {JOB_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.jobType && <p className={ERROR_CLASS}>{errors.jobType.message}</p>}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={LABEL_CLASS}>Equipment name*</label>
            <input
              type="text"
              {...register("equipmentName")}
              placeholder="Enter equipment name"
              className={FIELD_CLASS}
            />
            {errors.equipmentName && (
              <p className={ERROR_CLASS}>{errors.equipmentName.message}</p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Model*</label>
            <input
              type="text"
              {...register("model")}
              placeholder="Enter model"
              className={FIELD_CLASS}
            />
            {errors.model && <p className={ERROR_CLASS}>{errors.model.message}</p>}
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Service location (optional)</label>
          <input
            type="text"
            {...register("serviceLocation")}
            placeholder="Hospital, city, or address"
            className={FIELD_CLASS}
          />
          {errors.serviceLocation && (
            <p className={ERROR_CLASS}>{errors.serviceLocation.message}</p>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={LABEL_CLASS}>Preferred date*</label>
            <input type="date" {...register("preferredDate")} className={FIELD_CLASS} />
            {errors.preferredDate && (
              <p className={ERROR_CLASS}>{errors.preferredDate.message}</p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Preferred time*</label>
            <input type="time" {...register("preferredTime")} className={FIELD_CLASS} />
            {errors.preferredTime && (
              <p className={ERROR_CLASS}>{errors.preferredTime.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Service description*</label>
          <textarea
            {...register("serviceDescription")}
            rows={4}
            placeholder="Describe the work to be required."
            className="w-full rounded-[12px] border border-[#e1e9f3] px-4 py-3 text-sm text-[#1e2f49] outline-none transition focus:border-[#9ec7f2]"
          />
          {errors.serviceDescription && (
            <p className={ERROR_CLASS}>{errors.serviceDescription.message}</p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>Photo upload (optional)</label>
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
          {photoError && <p className={ERROR_CLASS}>{photoError}</p>}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/admin/services")}
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#ffd8bf] bg-white px-4 text-sm font-semibold text-[#f08a3c] transition hover:bg-[#fff7f1]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#0669d9] px-4 text-sm font-semibold text-white transition hover:bg-[#0459b9] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Create request"}
          </button>
        </div>
      </form>

      <PopUp
        open={showSuccess}
        type="success"
        title="Request Created"
        description="The service job request has been created and assigned successfully."
        primaryButtonText="View service requests"
        onClose={() => setShowSuccess(false)}
        onPrimaryAction={() => {
          setShowSuccess(false);
          router.push("/dashboard/admin/services");
        }}
        showIcon
      />
    </section>
  );
}
