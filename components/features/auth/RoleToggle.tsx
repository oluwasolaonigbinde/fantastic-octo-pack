import Image from "next/image";
import type React from "react";

interface RoleToggleProps {
  onChange: (val: "buyer" | "distributor" | "engineer" | "oem") => void;
  value?: "buyer" | "distributor" | "engineer" | "oem";
}

const options = [
  {
    id: "buyer",
    value: "buyer",
    label: "Buyer",
    icon: "/icons/Buyer.svg",
  },
  {
    id: "distributor",
    value: "distributor",
    label: "Distributor",
    icon: "/icons/Distributor.svg",
  },
  {
    id: "engineer",
    value: "engineer",
    label: "Engineer",
    icon: "/icons/Engineers.svg",
  },
  {
    id: "oem",
    value: "oem",
    label: "Manufacturer",
    icon: "/icons/OEMs.svg",
  },
];

export const RoleToggle: React.FC<RoleToggleProps> = ({ onChange, value }) => {
  return (
    <div className="grid grid-cols-2 gap-3 font-urbanist sm:grid-cols-4">
      {options.map((option) => (
        <label
          htmlFor={option.id}
          className={`group w-full cursor-pointer rounded-2xl border border-gray6 p-2 hover:border-primary ${
            value === option.value ? "border-primary" : ""
          }`}
          key={option.id}
        >
          <input
            type="radio"
            name="role"
            id={option.id}
            value={option.value}
            checked={value === option.value}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onChange(
                event.target.value as
                  | "buyer"
                  | "distributor"
                  | "engineer"
                  | "oem"
              );
            }}
            hidden
          />
          <div
            className={`flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl bg-gray7 px-2 py-4 text-center text-sm font-medium text-gray1 group-hover:bg-primary-light ${
              value === option.value ? "bg-primary-light" : ""
            }`}
          >
            <Image
              src={option.icon}
              alt="role"
              width={32}
              height={32}
            />
            <p>{option.label}</p>
          </div>
        </label>
      ))}
    </div>
  );
};
