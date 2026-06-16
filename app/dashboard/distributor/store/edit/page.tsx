"use client";

import { AlertCircle, ArrowLeft, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

import { Button, Input } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { updateDistributorStoreProfile } from "@/store/slices/auth-slice";
import type {
  DistributorStoreCertification,
  DistributorStoreProfile,
} from "@/types/user";
import Header from "../../../component/header";

type StoreFormState = {
  businessName: string;
  about: string;
  countriesCovered: string;
  dateFounded: string;
  categories: string;
  city: string;
  state: string;
  country: string;
  address: string;
};

type StoreFormDraft = {
  source?: DistributorStoreProfile;
  values: StoreFormState;
};

const emptyForm: StoreFormState = {
  businessName: "",
  about: "",
  countriesCovered: "",
  dateFounded: "",
  categories: "",
  city: "",
  state: "",
  country: "",
  address: "",
};

function profileToForm(profile?: DistributorStoreProfile): StoreFormState {
  return {
    businessName: profile?.businessName ?? "",
    about: profile?.about ?? "",
    countriesCovered: listToText(profile?.countriesCovered),
    dateFounded: profile?.dateFounded ?? "",
    categories: listToText(profile?.categories),
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    country: profile?.country ?? "",
    address: profile?.address ?? "",
  };
}

function listToText(values?: string[]): string {
  return values?.join(", ") ?? "";
}

function textToList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function UploadZone({
  label,
  optional,
  id,
  accept,
  multiple,
  files,
  onChange,
}: {
  label: string;
  optional?: boolean;
  id: string;
  accept: string;
  multiple?: boolean;
  files: File[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="px-4">
        <span className="text-base text-gray1">
          {label}
          {optional && <span className="text-gray4"> (optional)</span>}
        </span>
      </div>
      <label htmlFor={id} className="cursor-pointer">
        <div className="flex flex-col items-center gap-5 rounded-[14px] border px-4 py-8 text-center transition-colors hover:border-primary" style={{ borderColor: "#DDE0E5" }}>
          <FileText className="size-10 text-gray4" />
          <div className="space-y-1">
            <p className="text-base text-gray4">Click here to upload file</p>
            <p className="text-sm text-gray4">Allowed format - {accept}</p>
            {files.length ? (
              <p className="text-sm text-gray2">
                {files.map((file) => file.name).join(", ")}
              </p>
            ) : null}
          </div>
        </div>
        <input id={id} type="file" accept={accept} multiple={multiple} hidden onChange={onChange} />
      </label>
    </div>
  );
}

export default function EditStorePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: authData, isLoading, isError, message, lastCompletedAction } = useAppSelector((state) => state.auth);
  const storeProfile = authData?.distributorStoreProfile;
  const token = authData?.tokens?.accessToken;
  const profileFormState = useMemo(
    () => (storeProfile ? profileToForm(storeProfile) : emptyForm),
    [storeProfile],
  );

  const [formDraft, setFormDraft] = useState<StoreFormDraft>(() => ({
    source: storeProfile,
    values: profileFormState,
  }));
  const formState =
    formDraft.source === storeProfile ? formDraft.values : profileFormState;
  const [storeLogoFiles, setStoreLogoFiles] = useState<File[]>([]);
  const [coverPhotoFiles, setCoverPhotoFiles] = useState<File[]>([]);
  const [certificationFiles, setCertificationFiles] = useState<File[]>([]);
  const existingCertifications: DistributorStoreCertification[] =
    storeProfile?.certifications ?? [];

  const updateField =
    (field: keyof StoreFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormDraft((current) => {
        const currentValues =
          current.source === storeProfile ? current.values : profileFormState;

        return {
          source: storeProfile,
          values: {
            ...currentValues,
            [field]: event.target.value,
          },
        };
      });
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const result = await dispatch(
      updateDistributorStoreProfile({
        token,
        formData: {
          businessName: formState.businessName,
          about: formState.about,
          countriesCovered: textToList(formState.countriesCovered),
          dateFounded: formState.dateFounded,
          categories: textToList(formState.categories),
          city: formState.city,
          state: formState.state,
          country: formState.country,
          address: formState.address,
          certifications: existingCertifications,
          certificationNames: certificationFiles.map((file) => file.name),
          storeLogo: storeLogoFiles[0] ?? null,
          coverPhoto: coverPhotoFiles[0] ?? null,
          certificationFiles,
        },
      }),
    );

    if (updateDistributorStoreProfile.fulfilled.match(result)) {
      router.push("/dashboard/distributor/store");
    }
  };

  const saveFeedbackVisible = lastCompletedAction === "updateDistributorStoreProfile";

  return (
    <div>
      <Header
        title="Product Listings"
        description="Create, view and edit all listed products"
      />

      <div className="space-y-4 p-4 md:p-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-lg text-gray1 transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-6" />
          Edit Store
        </button>

        <div
          className="flex items-center justify-between gap-3 rounded-xl border px-5 py-3"
          style={{ background: "#FFFBF8", borderColor: "#FFE7D4" }}
        >
          <AlertCircle className="size-5 shrink-0" style={{ color: "#FE6E00" }} />
          <p className="flex-1 text-lg leading-snug" style={{ color: "#FE6E00" }}>
            Changes made will be updated across board
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 rounded-2xl border bg-white p-6 md:p-10" style={{ borderColor: "#DDE0E5" }}>
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
            <UploadZone
              id="logo-upload"
              label="Upload Logo For Display"
              accept=".jpg,.jpeg,.png"
              files={storeLogoFiles}
              onChange={(event) => setStoreLogoFiles(Array.from(event.target.files ?? []).slice(0, 1))}
            />
            <UploadZone
              id="cover-upload"
              label="Upload Cover Photo"
              optional
              accept=".jpg,.jpeg,.png"
              files={coverPhotoFiles}
              onChange={(event) => setCoverPhotoFiles(Array.from(event.target.files ?? []).slice(0, 1))}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor="about" className="px-4 text-base text-gray1">About Distributor</label>
            <textarea
              id="about"
              className="min-h-[140px] w-full resize-none rounded-xl border bg-white px-4 py-4 text-base text-gray1 placeholder:text-gray4 outline-none transition-colors focus:border-ring"
              placeholder="Enter store profile details"
              value={formState.about}
              onChange={updateField("about")}
              style={{ borderColor: "#DDE0E5" }}
            />
          </div>

          <div
            className="space-y-6 rounded-2xl border p-6"
            style={{ background: "#F9FAFB", borderColor: "#DDE0E5" }}
          >
            <div className="space-y-1">
              <h3 className="text-xl font-medium text-black">Distributor Information</h3>
              <p className="text-base text-black">Provide your details</p>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <Input label="Business name" value={formState.businessName} onChange={updateField("businessName")} placeholder="Enter business name" />
                <Input label="Countries covered" value={formState.countriesCovered} onChange={updateField("countriesCovered")} placeholder="Nigeria, Ghana" />
                <Input label="Date founded" value={formState.dateFounded} onChange={updateField("dateFounded")} placeholder="YYYY-MM-DD" />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Input label="Categories" value={formState.categories} onChange={updateField("categories")} placeholder="Radiology, Laboratory" />
                <Input label="Country" value={formState.country} onChange={updateField("country")} placeholder="Enter country" />
                <Input label="State" value={formState.state} onChange={updateField("state")} placeholder="Enter state" />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Input label="City" value={formState.city} onChange={updateField("city")} placeholder="Enter city" />
                <Input label="Address" value={formState.address} onChange={updateField("address")} placeholder="Enter address" />
              </div>
            </div>
          </div>

          <div
            className="space-y-6 rounded-2xl border p-6"
            style={{ background: "#F9FAFB", borderColor: "#DDE0E5" }}
          >
            <div className="space-y-1">
              <h3 className="text-xl font-medium text-black">Certifications</h3>
              <p className="text-base text-black">Upload the full certification set to save.</p>
            </div>

            {existingCertifications.length ? (
              <div className="space-y-2">
                {existingCertifications.map((cert) => (
                  <div key={cert.cloudinary_id} className="flex items-center gap-2 rounded-xl border border-gray5 bg-white px-4 py-3 text-sm text-gray2">
                    <FileText className="size-4" />
                    <span>{cert.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray5 bg-white px-4 py-4 text-sm text-gray2">
                No certifications uploaded yet.
              </div>
            )}

            <UploadZone
              id="cert-upload"
              label="Certification files"
              accept=".jpg,.jpeg,.png,.pdf,.docx"
              multiple
              files={certificationFiles}
              onChange={(event) => setCertificationFiles(Array.from(event.target.files ?? []))}
            />
          </div>

          {saveFeedbackVisible && isError ? (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {message || "Unable to update distributor store profile."}
            </div>
          ) : null}

          <Button
            title="Save Changes"
            type="submit"
            isBusy={isLoading}
            disabled={isLoading || !token}
            className="!h-16 !w-72 !rounded-[14px] lg:!w-80"
          />
        </form>
      </div>
    </div>
  );
}
