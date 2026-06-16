"use client";

import { useMemo, useState } from "react";
import { Edit3, Plus } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  isDefault?: boolean;
}

interface EditDeliveryAddressModalProps {
  isOpen: boolean;
  initialAddress: string;
  savedAddresses?: SavedAddress[];
  onClose: () => void;
  onSave: (address: string) => void;
}

const STATE_OPTIONS = [
  "Abuja",
  "Lagos",
  "Rivers",
  "Kano",
  "Oyo",
  "Enugu",
];

const CITY_OPTIONS: Record<string, string[]> = {
  Abuja: ["Garki", "Wuse", "Maitama"],
  Lagos: ["Ikeja", "Lekki", "Victoria Island"],
  Rivers: ["Port Harcourt", "Bonny", "Obio-Akpor"],
  Kano: ["Nassarawa", "Fagge", "Tarauni"],
  Oyo: ["Ibadan", "Ogbomosho", "Oyo"],
  Enugu: ["Enugu", "Nsukka", "Udi"],
};

function normalizeAddress(value: string): string {
  return value.trim() || "Delivery address not specified";
}

export default function EditDeliveryAddressModal({
  isOpen,
  initialAddress,
  savedAddresses,
  onClose,
  onSave,
}: EditDeliveryAddressModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <EditDeliveryAddressModalContent
      key={initialAddress}
      initialAddress={initialAddress}
      savedAddresses={savedAddresses}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function EditDeliveryAddressModalContent({
  initialAddress,
  savedAddresses,
  onClose,
  onSave,
}: Omit<EditDeliveryAddressModalProps, "isOpen">) {
  const addresses = useMemo<SavedAddress[]>(() => {
    const fallback = normalizeAddress(initialAddress);
    const provided = (savedAddresses ?? [])
      .map((item, index) => ({
        ...item,
        id: item.id || `address-${index + 1}`,
        address: normalizeAddress(item.address),
      }))
      .filter((item) => item.address);

    if (provided.length > 0) {
      return provided;
    }

    return [
      {
        id: "address-1",
        label: "Address One",
        address: fallback,
        isDefault: true,
      },
    ];
  }, [initialAddress, savedAddresses]);

  const [mode, setMode] = useState<"list" | "add">("list");
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id ?? "");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");

  const cityOptions = state ? CITY_OPTIONS[state] ?? [] : [];
  const selectedAddress =
    addresses.find((item) => item.id === selectedAddressId) ?? addresses[0];
  const canSaveNewAddress = Boolean(state && city && addressLine.trim());

  const saveNewAddress = () => {
    if (!canSaveNewAddress) {
      return;
    }

    onSave(`${addressLine.trim()}, ${city}, ${state}`);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-delivery-address-title"
        className="w-full max-w-[500px] space-y-7"
      >
        <section className="rounded-md bg-[#F3F4F6] p-2">
          <div className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-[#017BED] bg-white px-3">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold leading-4 text-[#4B5563]">
                Delivery Address
              </p>
              <p className="truncate text-[8px] leading-3 text-[#6B7280]">
                {selectedAddress?.address}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode("list")}
              className="inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#017BED] bg-[#EAF9FF] px-2 text-[8px] font-medium text-[#4B5563]"
            >
              Edit Address
              <Edit3 size={10} />
            </button>
          </div>
        </section>

        {mode === "list" ? (
          <section className="rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="edit-delivery-address-title"
                className="text-[17px] font-semibold leading-6 text-[#4B5563]"
              >
                Edit Address
              </h2>
              <button
                type="button"
                onClick={() => setMode("add")}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[#017BED] bg-[#EAF9FF] px-2.5 text-[8px] font-medium text-[#017BED]"
              >
                Add a new address
                <Plus size={10} />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {addresses.map((item) => {
                const selected = item.id === selectedAddressId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedAddressId(item.id);
                      onSave(item.address);
                    }}
                    className={`flex w-full gap-3 rounded-md px-3 py-3 text-left transition ${
                      selected ? "bg-[#F3F4F6]" : "bg-white hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-[#017BED]" : "border-[#6B7280]"
                      }`}
                    >
                      {selected ? (
                        <span className="size-2 rounded-full bg-[#017BED]" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-medium leading-4 text-[#4B5563]">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-[8px] leading-3 text-[#4B5563]">
                        {item.address}
                      </span>
                      {item.isDefault ? (
                        <span className="mt-2 inline-flex rounded bg-[#DCEAFE] px-2 py-0.5 text-[8px] text-[#017BED]">
                          Default address
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2
                  id="edit-delivery-address-title"
                  className="text-[17px] font-semibold leading-6 text-[#4B5563]"
                >
                  Add New Address
                </h2>
                <div className="mt-2 flex items-center gap-2 text-[9px] leading-4">
                  <span className="font-medium text-[#FF6B00]">Choose Address</span>
                  <span className="text-[#DDE0E5]">/</span>
                  <span className="text-[#4B5563]">Add Address</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMode("list")}
                className="inline-flex h-8 items-center justify-center rounded-full border border-[#017BED] bg-[#EAF9FF] px-2.5 text-[8px] font-medium text-[#4B5563]"
              >
                Enter Manually
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-[9px] font-medium text-[#4B5563]">
                  State
                </span>
                <Select
                  value={state}
                  onValueChange={(value) => {
                    setState(value);
                    setCity("");
                  }}
                >
                  <SelectTrigger className="h-10 rounded-md border-[#DDE0E5] px-3 text-[10px] shadow-none">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[9px] font-medium text-[#4B5563]">
                  City
                </span>
                <Select value={city} onValueChange={setCity} disabled={!state}>
                  <SelectTrigger className="h-10 rounded-md border-[#DDE0E5] px-3 text-[10px] shadow-none">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {cityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[9px] font-medium text-[#4B5563]">
                  Address
                </span>
                <input
                  value={addressLine}
                  onChange={(event) => setAddressLine(event.target.value)}
                  className="h-10 w-full rounded-md border border-[#DDE0E5] px-3 text-[10px] text-[#111827] outline-none placeholder:text-[#8A94A6] focus:border-[#017BED] focus:ring-2 focus:ring-[#017BED]/15"
                  placeholder="Enter full address"
                />
              </label>

              <button
                type="button"
                onClick={saveNewAddress}
                aria-disabled={!canSaveNewAddress}
                className="flex h-10 w-full items-center justify-center rounded-md bg-[#0669D9] text-[10px] font-medium text-white transition hover:bg-[#0553AE]"
              >
                Save
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
