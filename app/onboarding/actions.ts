"use server";

import {
  OnboardingSchema,
} from "./onboarding.schema";

type ActionResult = {
  success: boolean;
  message?: string;
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    phoneNumber?: string[];
    contactAddress?: string[];
    countriesServed?: string[];
    oemAttachedTo?: string[];
    bnplEligible?: string[];
    documentType?: string[];
    _form?: string[];
  };
};


export async function OnboardingAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phoneNumber: formData.get("phoneNumber"),
    constactAddress: formData.get("constactAddress"),
  };

  const result = OnboardingSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      errors: {
        firstName: result.error.flatten().fieldErrors.firstName,
        lastName: result.error.flatten().fieldErrors.lastName,
        email: result.error.flatten().fieldErrors.email,
        phoneNumber: result.error.flatten().fieldErrors.phoneNumber,
        contactAddress: result.error.flatten().fieldErrors.contactAddress,
      },
    };
  } else {
    return {
      success: true,
      message: "Step one successful",
    };
  }
}
