import { z } from "zod";

export const editInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(2, "Please provide a valid name")
    .max(100, "Name must be 100 characters or fewer"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .min(10, "Please provide a valid phone number")
    .max(20, "Please provide a valid phone number"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .min(10, "Address must be at least 10 characters long")
    .max(200, "Address must be 200 characters or fewer"),
});

export type EditFormData = z.infer<typeof editInfoSchema>;
