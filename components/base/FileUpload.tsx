"use client";

import { LucideFileText } from "lucide-react";
import React from "react";

interface FileUploadProps {
  id: string;
  label: string;
  size?: "sm" | "md" | "lg";
  accept?: string;
  multiple?: boolean;
  placeholder?: string;
  maxWidth?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  id,
  label,
  size = "lg",
  multiple,
  accept = "",
  maxWidth,
  onChange,
}) => {
  return (
    <div className={`flex w-full flex-col ${maxWidth}`}>
      <label htmlFor={id} className="type-label font-medium text-gray1">
        <span className="pl-3">{label}</span>
        <div className="mt-2 w-full cursor-pointer space-y-1 rounded-2xl border border-gray5 px-3 py-6 text-center text-gray5">
          <LucideFileText className="text-gray5 size-[40px] mx-auto" />
          <p className={size === "sm" ? "type-label-sm" : "type-title-md"}>
            <span className="text-secondary">Click here</span> to upload
          </p>
          <p className={`${size === "sm" ? "type-micro" : "type-body-md"} text-gray5`}>
            Allowed format - JPG, JPEG, PNG
          </p>
        </div>
        <input
          type="file"
          id={id}
          multiple={multiple}
          onChange={(e) => onChange(e)}
          accept={accept || ".docx,.pdf,.png"}
          hidden
          className="rounded-14 border border-gray-300 py-3 px-4 focus:outline-0 focus:border-gray-700 placeholder:text-gray-300"
        />
      </label>
    </div>
  );
};
