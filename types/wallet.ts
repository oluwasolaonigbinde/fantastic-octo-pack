export type WalletStatus = "active" | "frozen";

export interface WalletDedicatedAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  provider: string;
  customerCode: string;
  active: boolean;
}

export interface Wallet {
  _id: string;
  owner: string;
  /** Total wallet balance in kobo (includes held funds). */
  balance: number;
  /** Funds reserved for pending withdrawals (kobo). */
  heldBalance: number;
  /** Spendable balance (balance − heldBalance) in kobo. */
  availableBalance: number;
  currency: string;
  status: WalletStatus;
  dedicatedAccount?: WalletDedicatedAccount | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletResponse {
  success: boolean;
  message: string;
  data: Wallet;
}

export interface WalletListPagination {
  docs: Wallet[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface WalletListResponse {
  success: boolean;
  message: string;
  data: Wallet[] | WalletListPagination;
}

export interface WalletTopupPayload {
  /** Amount to top up, in kobo. */
  amount: number;
  /** Optional URL Paystack redirects to after checkout. Overrides the server-configured default. */
  callbackUrl?: string;
}

export interface WalletWithdrawPayload {
  /** Amount to withdraw, in kobo. */
  amount: number;
  /** 10-digit NUBAN account number. */
  accountNumber: string;
  /** Paystack bank code for the destination bank. */
  bankCode: string;
  /** Optional; verified against Paystack when omitted. */
  accountName?: string;
}

/** Paystack checkout details returned when topping up a wallet. */
export interface WalletTopupResult {
  reference?: string;
  authorizationUrl?: string;
  accessCode?: string;
  [key: string]: unknown;
}

export interface WalletTopupResponse {
  success: boolean;
  message: string;
  data: WalletTopupResult;
}

export interface WalletWithdrawResponse {
  success: boolean;
  message: string;
  data: Wallet;
}

export interface WalletListQuery {
  status?: WalletStatus;
  page?: number;
  limit?: number;
}
