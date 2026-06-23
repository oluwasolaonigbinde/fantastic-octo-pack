import { apiUrl } from "@/utils/api-base-url";
import type {
  Wallet,
  WalletListQuery,
  WalletListResponse,
  WalletResponse,
  WalletTopupPayload,
  WalletTopupResponse,
  WalletTopupResult,
  WalletWithdrawPayload,
  WalletWithdrawResponse,
} from "@/types/wallet";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const errorData = await response.json();
    return errorData.message || fallback;
  } catch {
    return fallback;
  }
};

const buildQuery = (params: object) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

/** GET /wallets/me — Get the authenticated user's wallet. */
const fetchMyWallet = async (token: string): Promise<Wallet> => {
  const response = await fetch(apiUrl("/wallets/me"), {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to fetch wallet"));
  }

  const body = (await response.json()) as WalletResponse;
  return body.data;
};

/** POST /wallets/me/topup — Top up wallet via Paystack checkout. */
const topUpWallet = async (
  token: string,
  payload: WalletTopupPayload,
): Promise<WalletTopupResult> => {
  const response = await fetch(apiUrl("/wallets/me/topup"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to initiate wallet top-up"),
    );
  }

  const body = (await response.json()) as WalletTopupResponse;
  return body.data;
};

/** POST /wallets/me/withdraw — Withdraw wallet funds to a bank account. */
const withdrawFromWallet = async (
  token: string,
  payload: WalletWithdrawPayload,
): Promise<Wallet> => {
  const response = await fetch(apiUrl("/wallets/me/withdraw"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to withdraw funds"),
    );
  }

  const body = (await response.json()) as WalletWithdrawResponse;
  return body.data;
};

/** GET /wallets — List all wallets (admin). */
const fetchWallets = async (
  token: string,
  query: WalletListQuery = {},
): Promise<WalletListResponse> => {
  const response = await fetch(apiUrl(`/wallets${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to fetch wallets"));
  }

  return response.json();
};

/** GET /wallets/{userId} — Get a user's wallet (admin). */
const fetchWalletByUserId = async (
  token: string,
  userId: string,
): Promise<Wallet> => {
  const response = await fetch(apiUrl(`/wallets/${userId}`), {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to fetch wallet"));
  }

  const body = (await response.json()) as WalletResponse;
  return body.data;
};

export const walletService = {
  fetchMyWallet,
  topUpWallet,
  withdrawFromWallet,
  fetchWallets,
  fetchWalletByUserId,
};

export default walletService;
