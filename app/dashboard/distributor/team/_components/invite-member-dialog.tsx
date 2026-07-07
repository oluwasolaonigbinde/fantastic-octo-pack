"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";

import { Button, Input } from "@/components/base";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/base";
import { useInviteMemberMutation } from "@/hooks/queries/team";

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
});

/** All invited members are assigned the "admin" role for now. */
const DEFAULT_ROLE_NAME = "admin";

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const [formError, setFormError] = useState("");
  const { mutateAsync, isPending } = useInviteMemberMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    mode: "onBlur",
    defaultValues: { email: "", firstName: "", lastName: "" },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      setFormError("");
    }
    onOpenChange(next);
  };

  const onSubmit = async (values: InviteFormData) => {
    setFormError("");

    try {
      await mutateAsync({
        email: values.email,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        roleName: DEFAULT_ROLE_NAME,
      });
      onOpenChange(false);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to send invitation",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Invite a team member
          </DialogTitle>
          <DialogDescription>
            Send an email invitation to join your account. They&apos;ll set a
            password to activate their seat.
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-3">
            <p className="text-sm text-danger">{formError}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input
            {...register("email")}
            id="email"
            type="email"
            label="Email address"
            placeholder="teammate@example.com"
            autoComplete="email"
            error={errors.email?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register("firstName")}
              id="firstName"
              label="First name"
              placeholder="Ada"
              error={errors.firstName?.message}
            />
            <Input
              {...register("lastName")}
              id="lastName"
              label="Last name"
              placeholder="Obi"
              error={errors.lastName?.message}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="primaryLight"
              title="Cancel"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            />
            <Button
              type="submit"
              title="Send invitation"
              isBusy={isPending}
              disabled={isPending}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
