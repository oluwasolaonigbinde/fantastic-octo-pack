import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "type-caption inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-3 py-1 font-medium leading-none transition-[color,box-shadow] overflow-hidden [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-primary-light text-primary",
        secondary: "border-secondary/20 bg-secondary-light text-secondary",
        destructive: "border-danger/15 bg-danger-light text-danger-dark",
        outline: "border-warning/35 bg-warning-light text-amber-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
