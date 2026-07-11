"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  Info,
  Minus,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import type { AddAddressPayload, UserAddress } from "@/types/address";

interface ConfirmOrderModalProps {
  isOpen: boolean;
  productName: string;
  productImage: string;
  sellerName: string;
  unitPrice: number;
  quantity: number;
  /** On-hand stock. When known, caps the quantity and blocks over-ordering. */
  availableQuantity?: number;
  /** Server/validation error to surface (e.g. "Insufficient stock"). */
  errorMessage?: string | null;
  isSubmitting?: boolean;
  /** The buyer's saved address book (GET /auth/delivery-addresses). */
  addresses?: UserAddress[];
  /** `_id` of the currently selected saved address, or "" to use the default. */
  selectedAddressId?: string;
  /** True while a new address is being persisted (POST /auth/delivery-addresses). */
  isSavingAddress?: boolean;
  onClose: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onSelectAddress?: (addressId: string) => void;
  /** Persist a new address to the buyer's address book, then resolve. */
  onAddAddress?: (payload: AddAddressPayload) => Promise<void>;
  /** Persist edits to an existing saved address, then resolve. */
  onUpdateAddress?: (
    addressId: string,
    payload: AddAddressPayload,
  ) => Promise<void>;
  /** Remove a saved address from the buyer's address book, then resolve. */
  onDeleteAddress?: (addressId: string) => Promise<void>;
  /** Mark a saved address as the buyer's default, then resolve. */
  onSetDefaultAddress?: (addressId: string) => Promise<void>;
  onMakePayment: () => void;
}

type EditView = "list" | "form";

const STATES = ["Lagos", "Abuja", "Rivers", "Oyo", "Kano"];
const CITIES: Record<string, string[]> = {
  Lagos: ["Ikeja", "Lekki", "Surulere", "Victoria Island"],
  Abuja: ["Garki", "Maitama", "Wuse", "Asokoro"],
  Rivers: ["Port Harcourt", "Obio-Akpor", "Eleme"],
  Oyo: ["Ibadan", "Ogbomosho", "Oyo"],
  Kano: ["Kano Municipal", "Fagge", "Dala"],
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value || 0)
    .replace(/^NGN\s?/, "₦");
}

function formatAddress(addr: UserAddress): string {
  return [addr.address, addr.city, addr.state, addr.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export default function ConfirmOrderModal({
  isOpen,
  productName,
  productImage,
  sellerName,
  unitPrice,
  quantity,
  availableQuantity,
  errorMessage,
  isSubmitting = false,
  addresses = [],
  selectedAddressId = "",
  isSavingAddress = false,
  onClose,
  onIncrement,
  onDecrement,
  onSelectAddress,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  onMakePayment,
}: ConfirmOrderModalProps) {
  const [editView, setEditView] = useState<EditView | null>(null);
  const [newState, setNewState] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  /** `_id` of the address being edited, or null when adding a new one. */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** `_id` of the address a delete/default action is currently running on. */
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = unitPrice * quantity;

  const hasStockInfo = typeof availableQuantity === "number";
  const isOutOfStock = hasStockInfo && availableQuantity <= 0;
  const exceedsStock = hasStockInfo && quantity > availableQuantity;
  const canIncrement = !hasStockInfo || quantity < availableQuantity;
  const stockNote = isOutOfStock
    ? "This product is currently out of stock."
    : exceedsStock
      ? `Only ${availableQuantity} unit${
          availableQuantity === 1 ? "" : "s"
        } available in stock.`
      : null;
  const disablePayment = isSubmitting || isOutOfStock || exceedsStock;

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
  const summaryAddress = selectedAddress ? formatAddress(selectedAddress) : "";
  const hasAddress = Boolean(summaryAddress);

  function resetForm() {
    setNewState("");
    setNewCity("");
    setNewAddress("");
    setEditingId(null);
    setAddError(null);
  }

  function startAdd() {
    resetForm();
    setEditView("form");
  }

  function startEdit(addr: UserAddress) {
    setNewState(addr.state);
    setNewCity(addr.city);
    setNewAddress(addr.address);
    setEditingId(addr._id);
    setAddError(null);
    setEditView("form");
  }

  async function handleSaveAddress() {
    if (!newState || !newCity || !newAddress.trim()) return;
    const payload: AddAddressPayload = {
      address: newAddress.trim(),
      city: newCity,
      state: newState,
      country: "Nigeria",
    };
    setAddError(null);
    try {
      if (editingId) {
        if (!onUpdateAddress) return;
        await onUpdateAddress(editingId, payload);
      } else {
        if (!onAddAddress) return;
        await onAddAddress(payload);
      }
      resetForm();
      setEditView("list");
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : "Could not save address",
      );
    }
  }

  async function handleDeleteAddress(addressId: string) {
    if (!onDeleteAddress) return;
    setAddError(null);
    setBusyId(addressId);
    try {
      await onDeleteAddress(addressId);
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : "Could not delete address",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleSetDefaultAddress(addressId: string) {
    if (!onSetDefaultAddress) return;
    setAddError(null);
    setBusyId(addressId);
    try {
      await onSetDefaultAddress(addressId);
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : "Could not set default address",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-order-title"
        className="relative max-h-[calc(100vh-32px)] w-full max-w-[760px] overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        {/* ── scrollable main content ── */}
        <div className="max-h-[calc(100vh-32px)] overflow-y-auto p-5 sm:p-8 lg:p-10">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close confirm order"
            className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full border border-[#DDE0E5] text-[#4B5563]"
          >
            <X size={20} />
          </button>

          <div className="space-y-7">
            <h2
              id="confirm-order-title"
              className="pr-10 text-[28px] font-black leading-tight text-[#4B5563] lg:text-[34px]"
            >
              Confirm Order
            </h2>

            {/* Current Order */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold leading-9 text-[#111827]">
                  Current Order
                </h3>
                <p className="text-sm leading-6 text-[#111827]">
                  Confirm the order details before proceeding to payment.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#DDE0E5] bg-gradient-to-r from-[#FDFCFE] to-[#F8F9FB] p-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="flex gap-4">
                    <div className="relative h-[120px] w-[130px] shrink-0 overflow-hidden rounded-lg bg-[#DDE0E5] sm:h-[140px] sm:w-[155px]">
                      <Image
                        src={productImage}
                        alt={productName}
                        fill
                        className="object-contain"
                        sizes="155px"
                      />
                    </div>

                    <div className="flex min-w-0 flex-col justify-center gap-3 text-[#4B5563]">
                      <p className="line-clamp-2 text-lg font-semibold leading-7 sm:text-xl">
                        {sellerName}
                      </p>
                      <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#DDE0E5] bg-white/40 px-3 py-2 text-sm text-[#4B5563] sm:text-base">
                        <span>Quantity</span>
                        <span className="font-bold">
                          {String(quantity).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <p className="text-[24px] font-bold leading-tight text-[#4B5563] sm:text-[28px]">
                      {formatCurrency(total)}
                    </p>

                    <div className="inline-flex items-center gap-3 rounded-xl border border-[#F3F4F6] bg-[rgba(221,224,229,0.2)] p-2.5">
                      <button
                        type="button"
                        onClick={onDecrement}
                        aria-label="Decrease quantity"
                        disabled={quantity <= 1}
                        className="flex size-10 items-center justify-center rounded-md bg-[#4B5563] text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="min-w-7 text-center text-2xl font-bold text-[#4B5563]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={onIncrement}
                        aria-label="Increase quantity"
                        disabled={!canIncrement}
                        className="flex size-10 items-center justify-center rounded-md bg-[#4B5563] text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Details */}
            <div className="space-y-5 rounded-[20px] bg-[#F9FAFB] p-5">
              <div>
                <h3 className="text-base font-medium leading-6 text-black">
                  Purchase Details
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[#4B5563]">
                  Confirm purchase details before proceeding to check out
                </p>
              </div>

              <div className="h-px bg-[#DDE0E5]" />

              <div className="rounded-xl bg-[#F3F4F6] p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-base font-semibold leading-7 text-[#4B5563]">
                      Delivery Address
                    </p>
                    <p className="mt-0.5 break-words text-sm leading-6 text-[#6B7280]">
                      {hasAddress
                        ? summaryAddress
                        : "No delivery address yet — add one to continue."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => (hasAddress ? setEditView("list") : startAdd())}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#017BED] bg-[#EAF9FF] px-3 text-sm font-semibold text-[#4B5563]"
                  >
                    {hasAddress ? "Edit Address" : "Add Address"}
                    {hasAddress ? <Edit3 size={16} /> : <Plus size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#111827]">
                <p className="text-xl font-semibold leading-9">
                  {formatCurrency(total)}
                </p>
                <p className="text-sm leading-5">Total Amount</p>
              </div>
            </div>

            {(stockNote || errorMessage) && (
              <p className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#DC2626]">
                {errorMessage ?? stockNote}
              </p>
            )}

            <button
              type="button"
              onClick={onMakePayment}
              disabled={disablePayment}
              className="flex h-[56px] w-full items-center justify-center rounded-xl bg-[#0669D9] text-base text-white transition hover:bg-[#0553AE] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? "Creating order..."
                : isOutOfStock
                  ? "Out of stock"
                  : "Make Payment"}
            </button>
          </div>
        </div>

        {/* ── Edit Address inner sheet (slides up over modal content) ── */}
        {editView !== null && (
          <div className="absolute inset-0 flex flex-col">
            {/* scrim over main content */}
            <button
              type="button"
              aria-label="Close edit address"
              className="flex-1 bg-black/30"
              onClick={() => {
                resetForm();
                setEditView(null);
              }}
            />

            {/* sheet */}
            <div className="max-h-[88%] overflow-y-auto rounded-t-[28px] bg-white p-5 sm:p-7">
              {editView === "list" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#111827]">
                      Edit Address
                    </h3>
                    <button
                      type="button"
                      onClick={startAdd}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDE0E5] bg-white px-3 py-2 text-sm font-medium text-[#4B5563]"
                    >
                      Add a new address
                      <Plus size={15} />
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#DDE0E5] bg-[#F9FAFB] p-4 text-sm text-[#6B7280]">
                      You have no saved addresses yet. Add one to continue — it
                      will be saved to your account for future orders.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => {
                        const isBusy = busyId === addr._id;
                        return (
                          <div
                            key={addr._id}
                            className={`rounded-xl border p-4 transition ${
                              selectedAddressId === addr._id
                                ? "border-[#017BED] bg-[#F5FAFF]"
                                : "border-[#DDE0E5] bg-[#F9FAFB]"
                            } ${isBusy ? "opacity-60" : ""}`}
                          >
                            <label className="flex cursor-pointer items-start gap-3">
                              <input
                                type="radio"
                                name="address"
                                value={addr._id}
                                checked={selectedAddressId === addr._id}
                                onChange={() => onSelectAddress?.(addr._id)}
                                className="mt-0.5 accent-[#017BED]"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#111827]">
                                  {addr.city}, {addr.state}
                                </p>
                                <p className="mt-0.5 text-sm text-[#6B7280]">
                                  {formatAddress(addr)}
                                </p>
                                {addr.isDefault && (
                                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#EAF9FF] px-2.5 py-0.5 text-xs font-medium text-[#017BED]">
                                    <Info size={11} />
                                    Default address
                                  </span>
                                )}
                              </div>
                            </label>

                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E5E7EB] pt-3">
                              {!addr.isDefault && onSetDefaultAddress && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(addr._id)}
                                  disabled={isBusy}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDE0E5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#4B5563] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Star size={13} />
                                  Set as default
                                </button>
                              )}
                              {onUpdateAddress && (
                                <button
                                  type="button"
                                  onClick={() => startEdit(addr)}
                                  disabled={isBusy}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDE0E5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#4B5563] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Edit3 size={13} />
                                  Edit
                                </button>
                              )}
                              {onDeleteAddress && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addr._id)}
                                  disabled={isBusy}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-2.5 py-1.5 text-xs font-medium text-[#DC2626] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Trash2 size={13} />
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setEditView(null)}
                    disabled={addresses.length === 0}
                    className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#0669D9] text-sm font-medium text-white transition hover:bg-[#0553AE] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Confirm Address
                  </button>
                </div>
              )}

              {editView === "form" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#111827]">
                      {editingId ? "Edit Address" : "Add New Address"}
                    </h3>
                  </div>

                  {/* breadcrumb */}
                  <div className="flex items-center gap-1.5 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setEditView("list");
                      }}
                      className="font-medium text-[#F97316] hover:underline"
                    >
                      Choose Address
                    </button>
                    <ChevronRight size={14} className="text-[#9CA3AF]" />
                    <span className="text-[#6B7280]">
                      {editingId ? "Edit Address" : "Add Address"}
                    </span>
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#374151]">
                      State
                    </label>
                    <div className="relative">
                      <select
                        value={newState}
                        onChange={(e) => {
                          setNewState(e.target.value);
                          setNewCity("");
                        }}
                        className="w-full appearance-none rounded-xl border border-[#DDE0E5] bg-white px-4 py-3 pr-10 text-sm text-[#6B7280] focus:border-[#017BED] focus:outline-none"
                      >
                        <option value="" disabled>
                          Select State
                        </option>
                        {STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#374151]">
                      City
                    </label>
                    <div className="relative">
                      <select
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        disabled={!newState}
                        className="w-full appearance-none rounded-xl border border-[#DDE0E5] bg-white px-4 py-3 pr-10 text-sm text-[#6B7280] focus:border-[#017BED] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="" disabled>
                          Select City
                        </option>
                        {(CITIES[newState] ?? []).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#374151]">
                      Address
                    </label>
                    <input
                      type="text"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Enter full address"
                      className="w-full rounded-xl border border-[#DDE0E5] bg-white px-4 py-3 text-sm text-[#374151] placeholder-[#9CA3AF] focus:border-[#017BED] focus:outline-none"
                    />
                  </div>

                  {addError && (
                    <p className="text-sm font-medium text-[#DC2626]">{addError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={
                      !newState || !newCity || !newAddress.trim() || isSavingAddress
                    }
                    className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#0669D9] text-sm font-medium text-white transition hover:bg-[#0553AE] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingAddress
                      ? "Saving..."
                      : editingId
                        ? "Save Changes"
                        : "Save"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
