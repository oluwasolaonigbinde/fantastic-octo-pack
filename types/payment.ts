export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "abandoned"
  | "refunded";

export type PaymentIntent =
  | "order_payment"
  | "wallet_topup"
  | "service_payment"
  | "withdrawal"
  | "escrow_release"
  | "refund";

export interface PaymentParty {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface PaymentDestinationBank {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface PaymentAttempt {
  attemptedAt: string;
  status: "pending" | "success" | "failed" | "abandoned";
  processorReference?: string;
  failureReason?: string | null;
}

export interface PaymentLedgerEntry {
  type: "debit" | "credit";
  account: string;
  amount: number;
  currency: string;
  description: string;
  confirmedAt?: string | null;
}

export interface PaymentTransaction {
  _id: string;
  entityType: string;
  entityId: string;
  intent: PaymentIntent;
  payer: PaymentParty;
  payee?: PaymentParty | null;
  /** Gross amount in smallest currency unit (kobo). */
  amount: number;
  /** Fee reported by the payment gateway (kobo). */
  gatewayFee?: number;
  currency: string;
  processor: string;
  reference: string;
  status: PaymentStatus;
  destinationBank?: PaymentDestinationBank | null;
  paymentAttempts?: PaymentAttempt[];
  ledgerEntries?: PaymentLedgerEntry[];
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentListPagination {
  docs: PaymentTransaction[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface PaymentListResponse {
  success: boolean;
  message: string;
  data: PaymentTransaction[] | PaymentListPagination;
}

export interface MyPaymentsQuery {
  status?: PaymentStatus;
  intent?: PaymentIntent;
  from?: string;
  to?: string;
}

export interface AllPaymentsQuery {
  status?: PaymentStatus;
  intent?: "order_payment" | "wallet_topup" | "service_payment";
  processor?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
