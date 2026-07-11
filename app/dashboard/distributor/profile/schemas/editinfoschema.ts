import { z } from "zod";

// email, role, status, and verification state are not editable
export const editInfoSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .min(2, "Please provide a valid first name")
    .max(50, "First name must be 50 characters or fewer"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .min(2, "Please provide a valid last name")
    .max(50, "Last name must be 50 characters or fewer"),
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
