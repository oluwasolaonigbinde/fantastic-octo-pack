import { Loader2Icon } from "lucide-react";
import Image from "next/image";

type SpinnerProps = {
  color?: "#00B2A9" | "#fce300";
  width?: number;
  padding?: number;
  showLoadingText?: boolean;
  loadingText?: string;
};

export const Spinner = ({
  color = "#00B2A9",
  width = 24,
  padding = width / 8,
  showLoadingText = false,
  loadingText = "Loading...",
}: SpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className="spinner"
        style={{
          background: color,
          width: `${width}px`,
          padding: `${padding}px`,
        }}
      />
      {showLoadingText && (
        <p className=" text-xxs text-gray-700">{loadingText}</p>
      )}
    </div>
  );
};

export const PageLoader = () => {
  return (
    <div className="flex justify-center items-center w-full h-screen">
      <span className="sr-only">Loading</span>
      <div className="relative fle/x items-cente/r w-fit h-fit">
        <Loader2Icon
          size={60}
          className="animate-spin text-primary"
          strokeWidth={1}
        />
        <Image
          src="/images/logo-small-primary.png"
          alt="Baiy logo"
          width={25}
          height={13}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  );
};

export const BigLoader = PageLoader;
