import { Loader2Icon } from "lucide-react";
import React from "react";
import Image from "next/image";

const BigLoader = () => {
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

export default BigLoader;
