import { z } from "zod";

export const editInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(2, "Please provide a valid name"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .min(10, "Please provide a valid phone number"),
  dateOfBirth: z.string().trim().min(1, "Date of birth is required"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .min(10, "Please provide a valid address"),
});

export type EditFormData = z.infer<typeof editInfoSchema>;
