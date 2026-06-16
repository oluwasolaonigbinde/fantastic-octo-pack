import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "type-title-md inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-normal transition-colors disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-primary-light aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "border border-primary bg-primary text-primary-foreground hover:bg-primary-dark",
        destructive:
          "border border-danger bg-danger text-white hover:bg-danger-dark focus-visible:ring-danger-light",
        outline:
          "border border-gray5 bg-white text-gray2 hover:bg-gray7 hover:text-gray1",
        secondary:
          "border border-secondary bg-secondary text-white hover:bg-secondary-dark",
        ghost:
          "text-gray2 hover:bg-gray7 hover:text-gray1",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-14 px-6 leading-6 has-[>svg]:px-5",
        sm: "type-body-md h-10 gap-1.5 px-5 has-[>svg]:px-4",
        lg: "h-14 px-6 leading-6 has-[>svg]:px-5",
        icon: "size-10",
        "icon-sm": "size-10",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
