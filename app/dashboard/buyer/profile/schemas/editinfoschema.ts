import { z } from "zod";

// email, role, status, and verification state

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
  // Buyers manage a structured delivery-address book instead of a free-text
  // profile address; PATCH /auth/profile ignores `address` for buyer accounts.
  // Every other role (engineer, agent, distributor, OEM) may set it, so the
  // field is optional here and only rendered/submitted for non-buyers.
  address: z
    .string()
    .trim()
    .max(255, "Address must be 255 characters or fewer")
    .optional(),
});

export type EditFormData = z.infer<typeof editInfoSchema>;
