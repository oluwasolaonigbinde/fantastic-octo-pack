import type { OrderPaymentMethod } from "@/types/order";

export type PaymentMethodId =
  | "wallet"
  | "paystack"
  | "flutterwave"
  | "bank-transfer";

export interface PaymentMethodOption {
  id: PaymentMethodId;
  title: string;
  description: string;
  /** Functional rails carry a method; the rest are "coming soon". */
  method: OrderPaymentMethod | null;
  recommended?: boolean;
}

/**
 * The four rails shown on the checkout / order payment screen. Only `wallet`
 * and `paystack` are wired to the API (see `OrderPaymentMethod`); the others
 * render in the design but stay disabled.
 */
export const ORDER_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "wallet",
    title: "BAIY Trade Assurance",
    description: "Pay from your Wallet balance",
    method: "wallet",
    recommended: true,
  },
  {
    id: "paystack",
    title: "Paystack",
    description: "Pay securely with your card, bank or USSD",
    method: "paystack",
  },
  {
    id: "flutterwave",
    title: "Flutterwave",
    description: "Pay with card, bank transfer and more",
    method: null,
  },
  {
    id: "bank-transfer",
    title: "Bank Transfer",
    description: "Make a direct transfer to our bank account",
    method: null,
  },
];

export const getPaymentMethodOption = (id: PaymentMethodId) =>
  ORDER_PAYMENT_METHODS.find((option) => option.id === id);
