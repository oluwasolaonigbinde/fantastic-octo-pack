import walletService from "@/services/walletService";
import type {
  Wallet,
  WalletListQuery,
  WalletTopupPayload,
  WalletTopupResult,
  WalletWithdrawPayload,
} from "@/types/wallet";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface WalletSliceState {
  wallet: Wallet | null;
  wallets: Wallet[] | null;
  currentWallet: Wallet | null;
  topup: WalletTopupResult | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
}

const initialState: WalletSliceState = {
  wallet: null,
  wallets: null,
  currentWallet: null,
  topup: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

const normalizeWalletsPayload = (payload: unknown): Wallet[] => {
  if (Array.isArray(payload)) {
    return payload as Wallet[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "docs" in payload &&
    Array.isArray((payload as { docs?: unknown }).docs)
  ) {
    return (payload as { docs: Wallet[] }).docs;
  }

  return [];
};

export const fetchMyWallet = createAsyncThunk(
  "wallet/fetchMine",
  async (token: string, thunkAPI) => {
    try {
      return await walletService.fetchMyWallet(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch wallet"
      );
    }
  }
);

export const topUpWallet = createAsyncThunk(
  "wallet/topup",
  async (
    { token, payload }: { token: string; payload: WalletTopupPayload },
    thunkAPI
  ) => {
    try {
      return await walletService.topUpWallet(token, payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to initiate wallet top-up"
      );
    }
  }
);

export const withdrawFromWallet = createAsyncThunk(
  "wallet/withdraw",
  async (
    { token, payload }: { token: string; payload: WalletWithdrawPayload },
    thunkAPI
  ) => {
    try {
      return await walletService.withdrawFromWallet(token, payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to withdraw funds"
      );
    }
  }
);

export const fetchWallets = createAsyncThunk(
  "wallet/fetchAll",
  async (
    { token, query }: { token: string; query?: WalletListQuery },
    thunkAPI
  ) => {
    try {
      return await walletService.fetchWallets(token, query);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch wallets"
      );
    }
  }
);

export const fetchWalletByUserId = createAsyncThunk(
  "wallet/fetchByUserId",
  async ({ token, userId }: { token: string; userId: string }, thunkAPI) => {
    try {
      return await walletService.fetchWalletByUserId(token, userId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch wallet"
      );
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    resetWallet: (state) => {
      state.wallet = null;
      state.wallets = null;
      state.currentWallet = null;
      state.topup = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearWalletTopup: (state) => {
      state.topup = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyWallet.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchMyWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.wallet = action.payload;
      })
      .addCase(fetchMyWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(topUpWallet.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(topUpWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.topup = action.payload;
      })
      .addCase(topUpWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(withdrawFromWallet.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(withdrawFromWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.wallet = action.payload;
      })
      .addCase(withdrawFromWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(fetchWallets.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchWallets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.wallets = normalizeWalletsPayload(action.payload.data);
        state.message = action.payload.message;
      })
      .addCase(fetchWallets.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(fetchWalletByUserId.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchWalletByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentWallet = action.payload;
      })
      .addCase(fetchWalletByUserId.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      });
  },
});

export const { resetWallet, clearWalletTopup } = walletSlice.actions;
export default walletSlice.reducer;
