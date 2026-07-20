"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Pencil, Upload } from "lucide-react";

import { Button, PopUp } from "@/components/base";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  reset as clearFeedback,
  updateUser,
  uploadDisplayPhoto,
} from "@/store/slices/auth-slice";
import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";

import EngineerTagField from "./engineer-tag-field";

const TABS = [
  { id: "picture", label: "Profile Picture" },
  { id: "expertise", label: "Equipment Type / Expertise" },
  { id: "experience", label: "Years of Experience" },
  { id: "summary", label: "Professional Summary" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SUMMARY_MAX = 500;
const ALLOWED_FILE_TYPES = ["image/png", "image/jpg", "image/jpeg"];

const CONTROL_CLASSES =
  "type-title-md h-[var(--control-height-lg)] w-full rounded-lg border border-gray5 bg-white px-4 text-gray1 outline-none transition-[border-color] placeholder:text-gray4 focus:border-ring";
const TEXTAREA_CLASSES =
  "type-title-md w-full resize-none rounded-lg border border-gray5 bg-white px-4 py-3 text-gray1 outline-none transition-[border-color] placeholder:text-gray4 focus:border-ring";
const MAX_FILE_SIZE = 4 * 1024 * 1024;

function VisibilityNote() {
  return (
    <div className="rounded-lg bg-primary-light px-4 py-3">
      <p className="text-sm text-primary-dark">
        This information will be visible to clients when they view your profile.
      </p>
    </div>
  );
}

/**
 * Mounted only while the dialog is open, so form state seeds itself from the
 * store on mount rather than needing a re-seeding effect.
 */
function EditEngineeringDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { data, isError, isLoading, lastCompletedAction, message } = useAppSelector(
    (state) => state.auth,
  );

  const [activeTab, setActiveTab] = useState<TabId>("picture");
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>(
    () => data?.equipmentTypes ?? [],
  );
  const [specializations, setSpecializations] = useState<string[]>(
    () => data?.specializations ?? [],
  );
  const [experienceYears, setExperienceYears] = useState(
    () => data?.experienceYears?.toString() ?? "",
  );
  const [oemTags, setOemTags] = useState(() => (data?.oemTags ?? []).join(", "));
  const [bio, setBio] = useState(() => data?.bio ?? "");
  const [certification, setCertification] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      setPhotoError("File size should be less than 4 MB.");
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setPhotoError("Only PNG, JPG, and JPEG files are supported.");
      return;
    }
    if (!data?.tokens?.accessToken) {
      setPhotoError("Your session has expired. Please log in again.");
      return;
    }

    const nextPreview = URL.createObjectURL(selectedFile);
    if (preview) URL.revokeObjectURL(preview);

    setPreview(nextPreview);
    setPhotoError("");
    setIsUploadingPhoto(true);
    await dispatch(clearFeedback());

    try {
      await dispatch(
        uploadDisplayPhoto({
          token: data.tokens.accessToken,
          fileData: { file: selectedFile },
        }),
      ).unwrap();
    } catch (error) {
      URL.revokeObjectURL(nextPreview);
      setPreview(null);
      setPhotoError(
        typeof error === "string" ? error : "Unable to upload your photo right now.",
      );
    } finally {
      event.target.value = "";
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!data?.tokens?.accessToken) return;

    await dispatch(clearFeedback());

    try {
      await dispatch(
        updateUser({
          token: data.tokens.accessToken,
          formData: {
            bio: bio || undefined,
            specializations,
            equipmentTypes,
            oemTags: oemTags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            experienceYears: experienceYears ? Number(experienceYears) : undefined,
          },
        }),
      ).unwrap();
      setSaved(true);
    } catch {
      // Error surfaced through slice state below.
    }
  };

  if (saved) {
    return (
      <PopUp
        description="Your engineering profile has been updated successfully"
        open={saved}
        onClose={() => {
          setSaved(false);
          void dispatch(clearFeedback());
          onClose();
        }}
      />
    );
  }

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="!max-w-3xl rounded-2xl p-4 sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="medium4">About Engineer</DialogTitle>
          <DialogDescription className="text-sm text-gray3">
            Tell client about your professional background and expertise.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 mt-4 overflow-x-auto border-b border-gray5 px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? "true" : "false"}
                  className={`whitespace-nowrap border-b-2 pb-2 text-sm transition ${
                    isActive
                      ? "border-primary font-medium text-primary"
                      : "border-transparent text-gray2 hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-h-[60vh] space-y-6 overflow-y-auto py-2">
          {activeTab === "picture" ? (
            <div className="space-y-4">
              <div>
                <p className="type-label font-medium text-gray2">Profile Picture</p>
                <p className="mt-1 text-sm text-gray3">
                  Upload a clear photo of yourself. PNG or JPG, up to 4 MB.
                </p>
              </div>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="relative size-24 shrink-0">
                  <Avatar className="size-24">
                    <AvatarImage
                      src={preview || data?.displayPhoto?.url || DEFAULT_AVATAR_SRC}
                      alt="Profile picture"
                    />
                    <AvatarFallback>
                      <span className="text-sm capitalize text-primary">
                        {data?.firstName?.slice(0, 1) || "U"}
                        {data?.lastName?.slice(0, 1) || ""}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="engineerProfilePhoto"
                    className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-white p-1.5 shadow-sm transition hover:scale-105"
                  >
                    <Camera size={16} />
                    <span className="sr-only">Upload profile picture</span>
                  </label>
                </div>

                <input
                  type="file"
                  id="engineerProfilePhoto"
                  className="hidden"
                  accept="image/png, image/jpg, image/jpeg"
                  onChange={handlePhotoChange}
                />

                <p className="text-sm text-gray3">
                  {isUploadingPhoto
                    ? "Uploading profile picture..."
                    : "Tap the camera icon to choose a new picture."}
                </p>
              </div>

              {photoError ? <p className="text-sm text-danger">{photoError}</p> : null}
              <VisibilityNote />
            </div>
          ) : null}

          {activeTab === "expertise" ? (
            <div className="space-y-6">
              <EngineerTagField
                label="Equipment Type"
                placeholder="e.g. Ultrasound Machine"
                values={equipmentTypes}
                onChange={setEquipmentTypes}
              />
              <EngineerTagField
                label="Specification / Expertise"
                placeholder="e.g. Preventive Maintenance"
                values={specializations}
                onChange={setSpecializations}
              />
              <VisibilityNote />
            </div>
          ) : null}

          {activeTab === "experience" ? (
            <div className="space-y-6">
              <div className="flex w-full flex-col gap-[var(--control-label-gap)]">
                <label
                  htmlFor="experienceYears"
                  className="type-label font-medium text-gray2"
                >
                  Years of Experience
                </label>
                <input
                  id="experienceYears"
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(event) => setExperienceYears(event.target.value)}
                  placeholder="e.g. 5"
                  className={CONTROL_CLASSES}
                />
              </div>

              <div className="flex w-full flex-col gap-[var(--control-label-gap)]">
                <label htmlFor="oemTags" className="type-label font-medium text-gray2">
                  Manufacturers / Distributors You work with
                </label>
                <p className="text-sm text-gray3">
                  List the manufacturers or distributors you have worked with (separate
                  with commas)
                </p>
                <textarea
                  id="oemTags"
                  rows={4}
                  maxLength={SUMMARY_MAX}
                  value={oemTags}
                  onChange={(event) => setOemTags(event.target.value)}
                  placeholder="Philips, GE Healthcare, Siemens, Canon Medical"
                  className={TEXTAREA_CLASSES}
                />
                <p className="self-end text-xs text-gray3">
                  {oemTags.length}/{SUMMARY_MAX}
                </p>
                <p className="text-xs text-gray3">
                  Example: Philips, GE Healthcare, Siemens etc.
                </p>
              </div>

              <VisibilityNote />
            </div>
          ) : null}

          {activeTab === "summary" ? (
            <div className="space-y-6">
              <div className="flex w-full flex-col gap-[var(--control-label-gap)]">
                <label htmlFor="bio" className="type-label font-medium text-gray2">
                  Professional Summary
                </label>
                <p className="text-sm text-gray3">
                  Briefly describe your skills, experience and what makes you a great
                  engineer
                </p>
                <textarea
                  id="bio"
                  rows={5}
                  maxLength={SUMMARY_MAX}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Write here..."
                  className={TEXTAREA_CLASSES}
                />
                <p className="self-end text-xs text-gray3">
                  {bio.length}/{SUMMARY_MAX}
                </p>
              </div>

              <div className="flex w-full flex-col gap-[var(--control-label-gap)]">
                <label
                  htmlFor="certification"
                  className="type-label font-medium text-gray2"
                >
                  Certifications (optional)
                </label>
                <p className="text-sm text-gray3">
                  Add your certificate or upload certificate
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="certification"
                    value={certification}
                    onChange={(event) => setCertification(event.target.value)}
                    placeholder="e.g. COREN Registered, OEM Certified"
                    className={CONTROL_CLASSES}
                  />
                  <label
                    htmlFor="certificateFile"
                    className="inline-flex h-[var(--control-height-lg)] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary px-4 text-sm font-medium text-primary transition hover:bg-primary-light"
                  >
                    <Upload size={16} />
                    Upload Certificate
                  </label>
                  <input
                    type="file"
                    id="certificateFile"
                    className="hidden"
                    accept="image/png, image/jpg, image/jpeg, application/pdf"
                    onChange={(event) =>
                      setCertificateName(event.target.files?.[0]?.name ?? "")
                    }
                  />
                </div>
                {certificateName ? (
                  <p className="text-xs text-gray3">Selected: {certificateName}</p>
                ) : null}
              </div>

              <VisibilityNote />
            </div>
          ) : null}
        </div>

        {isError && lastCompletedAction === "updateUser" ? (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{message}</p>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-gray5 pt-4 sm:flex-row sm:justify-start">
          <Button
            title="Cancel"
            variant="secondary"
            onClick={onClose}
            className="sm:!w-fit sm:!min-w-[140px]"
          />
          <Button
            title="Save changes"
            onClick={handleSave}
            isBusy={isLoading}
            disabled={isLoading}
            className="sm:!w-fit sm:!min-w-[160px]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InlineTags({ label, items }: { label: string; items?: string[] }) {
  return (
    <div>
      <p className="text-sm text-gray3">{label}</p>
      {items && items.length > 0 ? (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {items.map((item, index) => (
            <span key={item} className="flex items-center gap-3">
              {index > 0 ? (
                <span aria-hidden className="text-gray5">
                  |
                </span>
              ) : null}
              <span>{item}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-gray3 italic">Not set yet</p>
      )}
    </div>
  );
}

export default function AboutEngineering() {
  const { data } = useAppSelector((state) => state.auth);
  const [editing, setEditing] = useState(false);

  const experienceLabel = useMemo(() => {
    if (data?.experienceYears === undefined) return "Not set yet";
    return `${data.experienceYears} ${data.experienceYears === 1 ? "year" : "years"}`;
  }, [data?.experienceYears]);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-lg bg-white p-4 sm:p-6">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray3">Experience</p>
          <p>{experienceLabel}</p>
        </div>

        <InlineTags label="Specialization" items={data.specializations} />
        <InlineTags label="Equipment Type" items={data.equipmentTypes} />
        <InlineTags label="OEM Tags" items={data.oemTags} />

        <div className="border-t border-gray5 pt-6">
          <p className="text-sm text-gray3">About Engineering</p>
          <p className="mt-1">{data.bio || "Not set yet"}</p>
        </div>

        <Button
          title="Edit Engineering Info"
          iconLeft={<Pencil size={16} />}
          onClick={() => setEditing(true)}
          className="md:!w-fit"
        />
      </div>

      {editing ? <EditEngineeringDialog onClose={() => setEditing(false)} /> : null}
    </div>
  );
}
