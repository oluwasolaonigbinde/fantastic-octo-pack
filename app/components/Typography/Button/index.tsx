// import { Spinner } from "@/components/Typography/Spinner";
import * as React from "react";
import { Spinner } from "../Spinner";

// jsDoc to show descriptions on storybook
type ButtonProps = {
  /** Button children element */
  children?: React.ReactNode;
  /** Show loading spinner and disable button */
  isLoading?: boolean;
  /** Button color variant */
  className?: string;
  variants?: "primary" | "secondary" | "outline";
  size?: "base" | "lg" | "sm";
  /** Disable the button and add not-allowed cursor */
  disabled?: boolean;
} & React.ComponentPropsWithoutRef<"button">;

export const buttonVariants: Record<string, string> = {
  primary: "bg-primary text-white hover:brightness-105 active:brightness-90",
  secondary:
    "bg-secondary text-white text-sm font-medium hover:brightness-105 active:brightness-90",
  outline:
    "bg-transparent border border-gray-50 text-gray hover:brightness-105 active:brightness-90",
};

const Button: React.FC<ButtonProps> = ({
  size = "base",
  variants = "primary",
  ...props
}) => {
  const variantClass = buttonVariants[variants ?? "primary"];
  return (
    <button
      data-testid="button-element"
      onClick={props.onClick}
      type={props?.type ?? "button"}
      className={`transition flex justify-center gap-1 rounded-lg items-center font-Prompt ${
        (props.disabled || props.isLoading) && variantClass === "primary"
          ? "bg-gray-50 border-gray-50 text-[#c4c4c4]"
          : variantClass
      } ${size === "base" && "px-6 py-1"} ${size === "lg" && "px-4 py-3"} ${size === "sm" && "px-2 py-1"} ${
        props.className
      }`}
      disabled={props.disabled || props.isLoading}
    >
      {props.isLoading ? (
        // <Spinner />
        <Spinner/>
      ) : (
        <span className="font-Prompt transition flex flex-row gap-1 items-center">
          {props.children}
        </span>
      )}
    </button>
  );
};

export default Button;
