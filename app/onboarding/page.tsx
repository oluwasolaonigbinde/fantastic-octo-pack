"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/base";
import { Button } from "@/components/base";
import { SingleSelect } from "@/components/base";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare2, FileText, Pencil } from "lucide-react";
import { FileUpload } from "@/components/base";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OnboardingSchema, OnboardingFormData } from "./onboarding.schema";
import { OnboardingAction } from "./actions";
import { MAX_FILE_COUNT, MAX_FILE_SIZE } from "@/utils/constants";

export default function Onboarding() {
  const [state, firstFormAction] = useActionState(OnboardingAction, null);
  const [progress, setProgress] = useState(1);
  // const [preview, setPreview] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const STEP_FIELDS: (keyof OnboardingFormData)[][] = [
    ["firstName", "lastName", "email", "phoneNumber", "contactAddress"],
    ["countriesServed", "oemAttachedTo", "bnplEligible"],
    ["documentType", "files"],
    [],
  ];

  const ALLOWED_FILE_TYPES = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/pdf", // .pdf
    "image/png", // .png
  ];

  // const handleNextOrSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
  //   e.preventDefault();

  //   // 1. Validate only the fields for the current step
  //   const isValid = await trigger(["firstName", "lastName", "email", "phoneNumber", "contactAddress"], { shouldFocus: true });

  //   if (isValid) {
  //     if (progress === 4) {
  //       // 2. If it's the last step, call the RHF handleSubmit wrapper
  //       // This runs final validation on ALL fields before calling onSubmit
  //       handleSubmit(onSubmit)();
  //     } else {
  //       // 3. If valid, move to the next step
  //       setProgress((prev) => prev + 1);
  //     }
  //   } else {
  //     console.log("Step validation failed:", errors);
  //   }
  // };

  const validateAndProceed = async () => {
    // Get fields for current step
    console.log("Progress before::", progress);
    const currentStepFields = STEP_FIELDS[progress - 1];

    if (progress === 4) {
      handleFinalSubmit();
      return;
    }

    // Validate only current step fields
    const isStepValid = await trigger(currentStepFields as (keyof OnboardingFormData)[], {
      shouldFocus: true,
    });

    if (isStepValid) {
      setProgress(progress + 1);
      console.log("Progress after::", progress);
    } else {
      console.log("Step validation failed:", errors);
    }
  };

  const handleFinalSubmit = () => {
    // This will be called when all steps are validated
    const formData = getValues();
    console.log("FINAL SUBMISSION DATA:", formData);
    alert("Form Submitted! Check console for data.");
    // Here you would typically call your final server action
    // await finalOnboardingAction(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      // Filter for allowed file types and sizes
      const validFiles = filesArray.filter((file) => {
        const isCorrectType = ALLOWED_FILE_TYPES.includes(file.type);
        const isCorrectSize = file.size <= MAX_FILE_SIZE;

        if (!isCorrectType) {
          console.error(
            `Invalid file type: ${file.name}. Only .docx, .pdf, and .png files are allowed.`
          );
        }
        if (!isCorrectSize) {
          console.error(`File too large: ${file.name}. Maximum size is 5MB.`);
        }

        return isCorrectType && isCorrectSize;
      });

      // Check file count limit
      const totalFiles = files.length + validFiles.length;
      if (totalFiles > MAX_FILE_COUNT) {
        alert(`You can only upload a maximum of ${MAX_FILE_COUNT} files.`);
        return;
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        setValue("files", [...files, ...validFiles]);

        // Create preview URLs only for images (PNG)
        // const imagePreviews = validFiles
        //   .filter((file) => file.type === "image/png")
        //   .map((file) => URL.createObjectURL(file));
        // setPreview((prev) => [...prev, ...imagePreviews]);
      } else {
        alert(
          "No valid files selected. Please upload only .docx, .pdf, or .png files under 5MB."
        );
      }
    }
  };

  // Add file removal function
  // const removeFile = (index: number) => {
  //   setFiles((prev) => {
  //     const newFiles = prev.filter((_, i) => i !== index);
  //     setValue("files", newFiles as any);
  //     return newFiles;
  //   });

  //   // Clean up preview URLs if it's an image
  //   if (preview[index]) {
  //     URL.revokeObjectURL(preview[index]);
  //     setPreview((prev) => prev.filter((_, i) => i !== index));
  //   }
  // };

  const defaultFormValues: OnboardingFormData = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    contactAddress: "",
    // countriesServed: [], // Array for multiple selection
    countriesServed: "", // Array for multiple selection
    oemAttachedTo: "",
    bnplEligible: "NO" as "YES" | "NO",
    documentType: [],
    files: [] as File[], // Initialize as an empty array of File objects
  };

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    setValue,
    getValues,
    trigger,
    control,
  } = useForm({
    resolver: zodResolver(OnboardingSchema),
    mode: "onBlur",
    defaultValues: defaultFormValues,
  });

  return (
    <div className="h-screen bg-white max-w-[1440px] mx-auto">
      <div role="progressbar" className="w-full h-3">
        <div
          style={{ width: `${(progress / 4) * 100}%` }}
          className="bg-primary h-full transition-all duration-300"
        />
      </div>

      <div className="flex w-full">
        <div className="w-full max-w-[500px] border-r border-gray5 bg-gray7 px-12 py-12 space-y-16 ">
          <Image src="/logo.png" alt="logo" width={112} height={46} />
          <h1 className="h1 font-urbanist">
            Let&apos;s setup your profile in these 4 simple steps
          </h1>

          <div className="text-white max-w-2xl">
            <ul className="grid gap-6">
              {[
                "Personal info",
                "Distribution information",
                "Document Upload",
                "Verify and Submit",
              ].map((item, index) => (
                <li
                  key={`progress` + index}
                  className={`flex gap-3 ${
                    index + 1 < progress
                      ? "text-primary"
                      : index + 1 === progress
                      ? "text-gray1"
                      : "text-gray2"
                  } items-center`}
                >
                  <CheckSquare2
                    className={`${
                      index + 1 < progress && "text-primar/y"
                    } ${index}`}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="font-urbanist w-full space-y-8 p-8 overflow-y-auto overscroll-contain max-w-[664px] h-[98.5vh]">
          <div className="text-gray1">
            <p className="text-xl mb-2">Step {progress} of 4</p>
            {progress === 1 && "Enter your personal information"}
            {progress === 2 && "Enter your distribution information"}
            {progress === 3 && "Kindly upload every required document"}
            {progress === 4 && "Kindly verify your entries before submitting"}
          </div>

          <form className="space-y-3 mb-16" autoFocus>
            {progress === 1 && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8 md:gap-3">
                  <Input
                    {...register("firstName")}
                    label="First name"
                    placeholder="Enter your first name"
                    error={
                      errors.firstName && touchedFields.firstName
                        ? errors.firstName.message
                        : state?.errors?.firstName?.[0]
                    }
                  />
                  <Input
                    {...register("lastName")}
                    label="Last name"
                    placeholder="Enter your last name"
                    error={
                      errors.lastName && touchedFields.lastName
                        ? errors.lastName.message
                        : state?.errors?.lastName?.[0]
                    }
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-8 md:gap-3">
                  <Input
                    {...register("email")}
                    type="email"
                    label="Email address"
                    placeholder="Enter your email address"
                    error={
                      errors.email && touchedFields.email
                        ? errors.email.message
                        : state?.errors?.email?.[0]
                    }
                  />
                  <Input
                    {...register("phoneNumber")}
                    label="Phone number"
                    placeholder="Enter your phone number"
                    error={
                      errors.phoneNumber && touchedFields.phoneNumber
                        ? errors.phoneNumber.message
                        : state?.errors?.phoneNumber?.[0]
                    }
                  />
                </div>
                <Textarea
                  {...register("contactAddress")}
                  rows={5}
                  label="Contact address"
                  placeholder="Enter address here"
                  error={
                    errors.contactAddress && touchedFields.contactAddress
                      ? errors.contactAddress.message
                      : state?.errors?.contactAddress?.[0]
                  }
                  className="resize-none"
                />
              </div>
            )}

            {progress === 2 && (
              <div className="space-y-8">
                {/* <MultiSelect /> */}
                <div className="flex gap-6">
                  {/* <Controller
                    name="countriesServed"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultipleSelect
                      onBlur={field.onBlur}
                        label="Countries served"
                        placeholder="Select all that apply"
                        options={[
                          { label: "Option 1", value: "option-1" },
                          { label: "Option 2", value: "option-2" },
                        ]}
                        value={field.value || []}
                        onValueChange={field.onChange}
                        // onBlur={field.onBlur}
                        error={
                          fieldState.error?.message ||
                          state?.errors?.countriesServed?.[0]
                        }
                      />
                    )}
                  /> */}
                  <SingleSelect
                    {...register("countriesServed")}
                    label="Countries served"
                    placeholder="Select all that apply"
                    options={[
                      { label: "OEM 1", value: "oem-1" },
                      { label: "OEM 2", value: "oem-2" },
                      { label: "OEM 3", value: "oem-3" },
                    ]}
                    error={
                      errors.countriesServed && touchedFields.countriesServed
                        ? errors.countriesServed.message
                        : state?.errors?.oemAttachedTo?.[0]
                    }
                  />
                  <SingleSelect
                    {...register("oemAttachedTo")}
                    label="OEM attached to"
                    placeholder="Select OEM"
                    options={[
                      { label: "OEM 1", value: "oem-1" },
                      { label: "OEM 2", value: "oem-2" },
                    ]}
                    error={
                      errors.oemAttachedTo && touchedFields.oemAttachedTo
                        ? errors.oemAttachedTo.message
                        : state?.errors?.oemAttachedTo?.[0]
                    }
                  />
                </div>
                <SingleSelect
                  {...register("bnplEligible")}
                  label="BNPL eligible?"
                  placeholder="Select option"
                  options={[
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ]}
                  error={
                    errors.bnplEligible && touchedFields.bnplEligible
                      ? errors.bnplEligible.message
                      : state?.errors?.bnplEligible?.[0]
                  }
                  maxWidth="max-w-[320px]"
                />
              </div>
            )}
            {progress === 3 && (
              <div className="space-y-8">
                <SingleSelect
                  label="Select document to upload"
                  placeholder="Select document type"
                  options={[
                    { label: "Document 1", value: "document_1" },
                    { label: "Document 2", value: "document_2" },
                    { label: "Document 3", value: "document_3" },
                  ]}
                  error={
                    errors.documentType && touchedFields.documentType
                      ? errors.documentType.message
                      : state?.errors?.documentType?.[0]
                  }
                />

                <FileUpload
                  // value={""}
                  id="files"
                  label="Upload document"
                  maxWidth="w-full"
                  onChange={() => handleFileChange}
                />

                {files && (
                  <div className="flex gap-4 wrap">
                    {files.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex w-full">
                        <div className="flex justify-center items-center rounded-xl bg-primary-light w-[3.2rem] h-[3.2rem]">
                          <FileText className="text-primary" size={32} />
                        </div>
                        <div className="">
                          <p>{file.name}</p>
                          <p className="text-sm text-gray2">
                            {file.size / 1024 + "Mb"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {progress === 4 && (
              <div className="space-y-8">
                <div className="space-y-8">
                  <div className="flex justify-between gap-3">
                    <h2 className="text-xl">Personal Information</h2>
                    <button onClick={() => setProgress(1)}>
                      <Pencil className="text-gray2" />
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row gap-8 md:gap-3">
                    <Input
                      {...register("firstName")}
                      label="First name"
                      disabled
                      placeholder="Enter your first name"
                      error={
                        errors.firstName && touchedFields.firstName
                          ? errors.firstName.message
                          : state?.errors?.firstName?.[0]
                      }
                    />
                    <Input
                      {...register("lastName")}
                      label="Last name"
                      disabled
                      placeholder="Enter your last name"
                      error={
                        errors.lastName && touchedFields.lastName
                          ? errors.lastName.message
                          : state?.errors?.lastName?.[0]
                      }
                    />
                  </div>
                  <div className="flex flex-col md:flex-row gap-8 md:gap-3">
                    <Input
                      {...register("email")}
                      type="email"
                      label="Email address"
                      disabled
                      placeholder="Enter your email address"
                      error={
                        errors.email && touchedFields.email
                          ? errors.email.message
                          : state?.errors?.email?.[0]
                      }
                    />
                    <Input
                      {...register("phoneNumber")}
                      label="Phone number"
                      placeholder="Enter your phone number"
                      disabled
                      error={
                        errors.phoneNumber && touchedFields.phoneNumber
                          ? errors.phoneNumber.message
                          : state?.errors?.phoneNumber?.[0]
                      }
                    />
                  </div>
                  <Textarea
                    {...register("contactAddress")}
                    rows={5}
                    label="Contact address"
                    placeholder="Enter address here"
                    disabled
                    error={
                      errors.contactAddress && touchedFields.contactAddress
                        ? errors.contactAddress.message
                        : state?.errors?.contactAddress?.[0]
                    }
                    className="resize-none"
                  />
                </div>
                <div className="space-y-8">
                  <div className="flex justify-between gap-3">
                    <h2 className="text-xl">Distribution Information</h2>
                    <button onClick={() => setProgress(1)}>
                      <Pencil className="text-gray2" />
                    </button>
                  </div>
                  <div className="flex gap-6">
                    <SingleSelect
                      disabled
                      {...register("countriesServed")}
                      label="Countries served"
                      placeholder="Select all that apply"
                      options={[
                        { label: "OEM 1", value: "oem-1" },
                        { label: "OEM 2", value: "oem-2" },
                        { label: "OEM 3", value: "oem-3" },
                      ]}
                      error={
                        errors.countriesServed && touchedFields.countriesServed
                          ? errors.countriesServed.message
                          : state?.errors?.oemAttachedTo?.[0]
                      }
                    />
                    <SingleSelect
                      {...register("oemAttachedTo")}
                      label="OEM attached to"
                      placeholder="Select OEM"
                      disabled
                      options={[
                        { label: "OEM 1", value: "oem-1" },
                        { label: "OEM 2", value: "oem-2" },
                      ]}
                      error={
                        errors.oemAttachedTo && touchedFields.oemAttachedTo
                          ? errors.oemAttachedTo.message
                          : state?.errors?.oemAttachedTo?.[0]
                      }
                    />
                  </div>
                  <SingleSelect
                    {...register("bnplEligible")}
                    label="BNPL eligible?"
                    placeholder="Select option"
                    disabled
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                    error={
                      errors.bnplEligible && touchedFields.bnplEligible
                        ? errors.bnplEligible.message
                        : state?.errors?.bnplEligible?.[0]
                    }
                    maxWidth="max-w-[320px]"
                  />
                </div>
                <div className="space-y-8">
                  <SingleSelect
                    label="Select document to upload"
                    placeholder="Select document type"
                    options={[
                      { label: "Document 1", value: "document_1" },
                      { label: "Document 2", value: "document_2" },
                      { label: "Document 3", value: "document_3" },
                    ]}
                    error={
                      errors.documentType && touchedFields.documentType
                        ? errors.documentType.message
                        : state?.errors?.documentType?.[0]
                    }
                  />
                </div>
                <FileUpload
                  // value={""}
                  id="files"
                  label=""
                  onChange={() => handleFileChange}
                />

                {files && (
                  <div className="flex gap-4 wrap">
                    {files.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex w-full">
                        <div className="flex justify-center items-center rounded-xl bg-primary-light w-[3.2rem] h-[3.2rem]">
                          <FileText className="text-primary" size={32} />
                        </div>
                        <div className="">
                          <p>{file.name}</p>
                          <p className="text-sm text-gray2">
                            {file.size / 1024 + "Mb"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-6 mt-12">
              <Button
                variant="secondaryLight"
                title="Cancel"
                iconLeft={<img src="/icons/Cancel.svg" alt="Cancel" />}
              />
              <Button
                title="Save & Continue"
                onClick={() => validateAndProceed()}
                iconRight={
                  <img src="/icons/arrow-right.svg" alt="arrow_left" />
                }
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

