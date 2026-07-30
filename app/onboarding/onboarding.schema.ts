import { z } from "zod";

import { isValidE164Phone } from "@/utils/phone";

// Custom file validation
const allowedFileTypes = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/pdf', // .pdf
  'image/png', // .png
];

const isBrowserFile = (value: unknown): value is File =>
  typeof File !== "undefined" && value instanceof File;

const fileSchema = z.custom<File>(isBrowserFile, {
  message: "File must be a .docx, .pdf, or .png",
}).refine(
  (file) => allowedFileTypes.includes(file.type),
  { message: "File must be a .docx, .pdf, or .png" }
).refine(
  (file) => file.size <= 5 * 1024 * 1024, // 5MB limit
  { message: "File size must be less than 5MB" }
);

export const OnboardingSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(isValidE164Phone, {
      message: "Phone number must include a country code, for example +2348012345678",
    }),
  contactAddress: z.string().trim().min(5, "Enter a valid address"),
  // countriesServed: z.array(z.string()).min(1, "Select at least one country"),
  countriesServed: z.string().min(1, "Select at least one country"),
  oemAttachedTo: z.string().min(1, "Select an OEM"),
  bnplEligible: z.enum(["YES", "NO"]).default("NO"),
  documentType: z.array(z.string()).min(1, "Select at least one document type"),
  files: z.array(fileSchema).min(1, "Please upload at least one document"),
});

export const documentUploadSchema = z.object({
  documentType: z.array(z.string()).min(1, "Select at least one document type"),
  files: z.array(fileSchema).min(1, "Please upload at least one document"),
});

export type OnboardingFormData = z.infer<typeof OnboardingSchema>;
