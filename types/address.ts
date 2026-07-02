/**
 * Saved delivery address living in the authenticated user's address book.
 * Backed by the `/auth/addresses` routes. Buy Now resolves the order's delivery
 * address from one of these (by `_id`) or the user's default when none is given.
 */
export interface UserAddress {
  _id: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string | null;
  isDefault?: boolean;
}

/** Request body for POST /auth/addresses. */
export interface AddAddressPayload {
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string | null;
  /** Mark this address as the buyer's default delivery address. */
  isDefault?: boolean;
}

/** Request body for PATCH /auth/addresses/:addressId — all fields optional. */
export type UpdateAddressPayload = Partial<AddAddressPayload>;

/**
 * The address routes return the user's FULL address book after every mutation,
 * so callers always receive the up-to-date list.
 */
export interface AddressListResponse {
  success: boolean;
  message: string;
  data: UserAddress[];
}
