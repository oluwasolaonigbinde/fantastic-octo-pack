import type {
  AddAddressPayload,
  AddressListResponse,
  UpdateAddressPayload,
} from "@/types/address";
import type { UserData } from "@/types/user";
import { apiUrl } from "@/utils/api-base-url";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
};

/** GET /auth/profile — the authenticated user's profile (used to resolve the
 * default delivery address before any address has been saved). */
export const fetchProfile = async (
  token: string,
): Promise<{ success: boolean; message: string; data: UserData }> => {
  const res = await fetch(apiUrl("/auth/profile"), {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  });
  return handleResponse(res);
};

/** GET /auth/addresses — list the user's saved delivery addresses. */
export const fetchAddresses = async (
  token: string,
): Promise<AddressListResponse> => {
  const res = await fetch(apiUrl("/auth/addresses"), {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  });
  return handleResponse(res);
};

/**
 * POST /auth/addresses — permanently add an address to the user's address book.
 * Returns the full, updated address list.
 */
export const addAddress = async (
  token: string,
  payload: AddAddressPayload,
): Promise<AddressListResponse> => {
  const res = await fetch(apiUrl("/auth/addresses"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

/** PATCH /auth/addresses/:addressId — update a saved address. */
export const updateAddress = async (
  token: string,
  addressId: string,
  payload: UpdateAddressPayload,
): Promise<AddressListResponse> => {
  const res = await fetch(apiUrl(`/auth/addresses/${addressId}`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

/** DELETE /auth/addresses/:addressId — remove a saved address. */
export const deleteAddress = async (
  token: string,
  addressId: string,
): Promise<AddressListResponse> => {
  const res = await fetch(apiUrl(`/auth/addresses/${addressId}`), {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

/** PATCH /auth/addresses/:addressId/default — mark an address as the default. */
export const setDefaultAddress = async (
  token: string,
  addressId: string,
): Promise<AddressListResponse> => {
  const res = await fetch(apiUrl(`/auth/addresses/${addressId}/default`), {
    method: "PATCH",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

const addressService = {
  fetchProfile,
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};

export default addressService;
