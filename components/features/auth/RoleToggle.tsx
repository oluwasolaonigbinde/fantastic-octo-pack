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
    <div className="grid grid-cols-2 gap-4 font-urbanist">
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <label
            htmlFor={option.id}
            key={option.id}
            className={`group min-h-[146px] min-w-[129px] w-full cursor-pointer rounded-2xl p-2 transition-[border-color] ${
              isSelected
                ? "border-2 border-[#053782]"
                : "border-2 border-gray6 hover:border-[#053782]/40"
            }`}
          >
            <input
              type="radio"
              name="role"
              id={option.id}
              value={option.value}
              checked={isSelected}
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
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl bg-gray7 px-2 py-6 text-center text-sm font-medium text-gray1">
              <Image
                src={option.icon}
                alt="role"
                width={36}
                height={36}
              />
              <p>{option.label}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
};
