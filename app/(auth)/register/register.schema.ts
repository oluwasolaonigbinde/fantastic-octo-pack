import { z } from "zod";

const isInternationalPhoneNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) {
    return false;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");
  return /^\+[1-9]\d{7,14}$/.test(`+${digitsOnly}`);
};

export const RegisterSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required"),
  email: z
    .email()
    .trim()
    .min(1, "Email is required"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(isInternationalPhoneNumber, {
      message:
        "Phone number must include a country code, for example +2348012345678",
    }),
  acceptTerms: z
    .boolean()
    .refine((value) => value, {
      message:
        "You must accept the Terms & Condition and Privacy Policy to proceed.",
    }),
});

export type RegisterFormData = z.infer<typeof RegisterSchema>;
