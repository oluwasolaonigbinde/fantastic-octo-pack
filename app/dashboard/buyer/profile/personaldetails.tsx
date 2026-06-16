"use client";

import { useEffect, useState } from "react";
import { Camera, Pencil } from "lucide-react";

import { Button, RightSlider } from "@/components/base";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { formatDate } from "@/utils/formatDate";
import { UserRole } from "@/types/user";
import { reset as clearFeedback, uploadDisplayPhoto } from "@/store/slices/auth-slice";

import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";

import EditInfoForm from "./editInfoForm";

function roleDisplayLabel(role: string | undefined) {
  if (role === UserRole.ENGINEER) return "Service Engineer";
  if (!role) return "—";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const ALLOWED_FILE_TYPES = ["image/png", "image/jpg", "image/jpeg"];
const MAX_FILE_SIZE = 4 * 1024 * 1024;

const PersonalDetails = () => {
  const dispatch = useAppDispatch();
  const { data, isError, isSuccess, lastCompletedAction, message } = useAppSelector(
    (state) => state.auth,
  );
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [localPhotoError, setLocalPhotoError] = useState("");

  useEffect(() => {
    if (data?.displayPhoto?.url && preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [data?.displayPhoto?.url, preview]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  if (!data) {
    return <div>Loading...</div>;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) {
      return;
    }

    const selectedFile = event.target.files[0];

    if (selectedFile.size > MAX_FILE_SIZE) {
      setLocalPhotoError("File size should be less than 4 MB.");
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setLocalPhotoError("Only PNG, JPG, and JPEG files are supported.");
      return;
    }

    if (!data.tokens?.accessToken) {
      setLocalPhotoError("Your session has expired. Please log in again.");
      return;
    }

    const nextPreview = URL.createObjectURL(selectedFile);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(nextPreview);
    setLocalPhotoError("");
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
      setLocalPhotoError(
        typeof error === "string"
          ? error
          : "Unable to upload your display photo right now.",
      );
    } finally {
      event.target.value = "";
      setIsUploadingPhoto(false);
    }
  };

  const dateOfBirth = data.dateOfBirth ? formatDate(data.dateOfBirth) : "Not set yet";
  const photoFeedbackVisible = lastCompletedAction === "uploadDisplayPhoto";

  return (
    <div className="rounded-lg bg-white p-6">
      <div className="flex flex-col gap-6 border-b border-gray5 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative size-16 md:size-[4.375rem]">
            <Avatar className="size-16 md:size-[4.375rem]">
              <AvatarImage
                src={preview || data.displayPhoto?.url || DEFAULT_AVATAR_SRC}
                alt={`${data.firstName || "User"} ${data.lastName || ""}`}
              />
              <AvatarFallback>
                <span className="text-[12px] capitalize text-primary">
                  {data.firstName?.slice(0, 1) || "U"}
                  {data.lastName?.slice(0, 1) || ""}
                </span>
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="profilePhoto"
              className="absolute bottom-0 right-0 w-fit cursor-pointer rounded-full bg-white/90 p-1 shadow-sm transition hover:scale-105"
            >
              <Camera />
            </label>
          </div>

          <input
            type="file"
            name="profilePhoto"
            id="profilePhoto"
            aria-label="Upload profile photo"
            className="hidden"
            onChange={handleFileChange}
            accept="image/png, image/jpg, image/jpeg"
          />

          <div>
            <h2 className="medium4 capitalize">{`${data.firstName || "User"} ${data.lastName || ""}`}</h2>
            <p className="inline-flex flex-col gap-2 text-sm leading-3 md:flex-row md:items-center">
              <span>{roleDisplayLabel(data.role)}</span> | {data.email}
            </p>
            <p className="mt-2 text-xs text-gray3">
              {isUploadingPhoto
                ? "Uploading display photo..."
                : "Tap the camera icon to upload a new display photo."}
            </p>
          </div>
        </div>
        <Button
          title="Edit Personal Info"
          iconLeft={<Pencil size={16} />}
          onClick={() => setEditing(true)}
          className="md:!w-fit"
        />
      </div>

      {localPhotoError ? (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{localPhotoError}</p>
        </div>
      ) : null}

      {photoFeedbackVisible && !localPhotoError ? (
        <div
          className={`mt-4 rounded-md p-4 ${
            isSuccess ? "bg-green-50" : isError ? "bg-red-50" : "bg-gray7"
          }`}
        >
          <p
            className={`text-sm ${
              isSuccess ? "text-success" : isError ? "text-red-800" : "text-gray1"
            }`}
          >
            {message}
          </p>
        </div>
      ) : null}

      <div className="mt-6 h-[calc(100vh-24rem)] space-y-6 overflow-auto">
        <div className="flex flex-col gap-6 md:flex-row">
          <div>
            <p className="text-sm text-gray3">Name</p>
            <p>{`${data.firstName || "Firstname"} ${data.lastName || "Lastname"}`}</p>
          </div>
          <div>
            <p className="text-sm text-gray3">Email address</p>
            <p>{data.email}</p>
          </div>
        </div>
        <div className="flex flex-col gap-6 md:flex-row">
          <div>
            <p className="text-sm text-gray3">Phone number</p>
            <p>{data.phoneNumber || "Not set yet"}</p>
          </div>
          <div>
            <p className="text-sm text-gray3">Date of birth</p>
            <p>{dateOfBirth}</p>
          </div>
          <div>
            <p className="text-sm text-gray3">Role</p>
            <p>{roleDisplayLabel(data.role)}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray3">Address</p>
          <p>{data.address || "Not set yet"}</p>
        </div>
      </div>

      <RightSlider
        title="Edit Personal Info"
        open={editing}
        onClose={() => setEditing(false)}
      >
        <EditInfoForm onClose={() => setEditing(false)} />
      </RightSlider>
    </div>
  );
};

export default PersonalDetails;
