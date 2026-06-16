import { z } from "zod";

export const passwordSchema = z.object({  
  currentPassword: z
    .string()
    .trim()
    .min(1, "Current password is required"),
  newPassword: z
    .string()
    .trim()
    .min(1, "New password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/,"Password must contain at least one lowercase letter")
    .regex(/[A-Z]/,"Password must contain at least one uppercase letter")
    .regex(/[0-9]/,"Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/,"Password must contain at least one special character"),
  confirmPassword: z
    .string()
    .min(1, "Confirm password is required")
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ["confirmPassword"],
  error: "Passwords do not match",
});

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export type PasswordFormData = z.infer<typeof passwordSchema>;
