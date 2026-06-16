"use client";

import React, { useState } from "react";

interface RoleToggleProps {
  onChange: (val: "buyer" | "distributor" | "engineer" | "oem") => void;
}

const options = [
  {
    id: "distributor",
    value: "distributor",
    label: "Distributor",
    icon: "/icons/Distributor.svg",
  },
  {
    id: "oem",
    value: "oem",
    label: "OEM",
    icon: "/icons/OEMs.svg",
  },
  {
    id: "engineer",
    value: "engineer",
    label: "Engineer",
    icon: "/icons/Engineers.svg",
  },
  {
    id: "buyer",
    value: "buyer",
    label: "Buyer",
    icon: "/icons/Buyer.svg",
  },
];

export const RoleToggle: React.FC<RoleToggleProps> = ({ onChange }) => {
  const [isChecked, setIsChecked] = useState("buyer");

  return (
    <div className="grid grid-cols-4 gap-2 font-urbanist">
      {options.map((option) => (
        <label
          htmlFor={option.id}
          className={`group rounded-xl border border-gray6 p-1 md:p-2 w-full hover:border-primary cursor-pointer ${
            isChecked === option.value ? "border-primary" : ""
          }`}
          key={option.id}
        >
          <input
            type="radio"
            name="role"
            id={option.id}
            value={option.value}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onChange(
                event.target.value as
                  | "buyer"
                  | "distributor"
                  | "engineer"
                  | "oem"
              );
              setIsChecked(event.target.value);
            }}
            hidden
          />
          <div
            className={`flex flex-col items-center gap-1 text-xs mdtext-sm text-gray1 py-3 p-px md:px-1 bg-gray7 rounded-lg group-hover:bg-primary-light ${
              isChecked === option.value ? "bg-primary-light" : ""
            }`}
          >
            <img
              src={option.icon}
              alt="role"
              className="size-[18] md:size-[24px]"
            />
            <p>{option.label}</p>
          </div>
        </label>
      ))}
    </div>
  );
};
