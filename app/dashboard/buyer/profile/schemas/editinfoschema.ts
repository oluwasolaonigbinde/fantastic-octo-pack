import { z } from "zod";

// email, role, status, and verification state

export const editInfoSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .min(2, "Please provide a valid first name"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .min(2, "Please provide a valid last name"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .min(10, "Please provide a valid phone number"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .min(10, "Please provide a valid address"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Please provide a valid date of birth",
    }),
});

export type EditFormData = z.infer<typeof editInfoSchema>;
