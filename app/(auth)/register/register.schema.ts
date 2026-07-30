import { z } from "zod";

import { isValidE164Phone } from "@/utils/phone";

export const RegisterSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or fewer"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or fewer"),
  email: z
    .email()
    .trim()
    .min(1, "Email is required"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(isValidE164Phone, {
      message: "Phone number must include a country code, for example +2348012345678",
    }),
  acceptTerms: z
    .boolean()
    .refine((value) => value, {
      message:
        "You must accept the Terms & Condition and Privacy Policy to proceed.",
    }),
});

export type RegisterFormData = z.infer<typeof RegisterSchema>;
