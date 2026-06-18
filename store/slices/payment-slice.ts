import paymentService from "@/services/paymentService";
import type {
  AllPaymentsQuery,
  MyPaymentsQuery,
  PaymentTransaction,
} from "@/types/payment";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface PaymentSliceState {
  myPayments: PaymentTransaction[] | null;
  payments: PaymentTransaction[] | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
}

const initialState: PaymentSliceState = {
  myPayments: null,
  payments: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

const normalizePaymentsPayload = (payload: unknown): PaymentTransaction[] => {
  if (Array.isArray(payload)) {
    return payload as PaymentTransaction[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "docs" in payload &&
    Array.isArray((payload as { docs?: unknown }).docs)
  ) {
    return (payload as { docs: PaymentTransaction[] }).docs;
  }

  return [];
};

export const fetchMyPayments = createAsyncThunk(
  "payment/fetchMine",
  async (
    { token, query }: { token: string; query?: MyPaymentsQuery },
    thunkAPI
  ) => {
    try {
      return await paymentService.fetchMyPayments(token, query);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch transactions"
      );
    }
  }
);

export const fetchPayments = createAsyncThunk(
  "payment/fetchAll",
  async (
    { token, query }: { token: string; query?: AllPaymentsQuery },
    thunkAPI
  ) => {
    try {
      return await paymentService.fetchPayments(token, query);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch payments"
      );
    }
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    resetPayments: (state) => {
      state.myPayments = null;
      state.payments = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPayments.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchMyPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.myPayments = normalizePaymentsPayload(action.payload.data);
        state.message = action.payload.message;
      })
      .addCase(fetchMyPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(fetchPayments.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments = normalizePaymentsPayload(action.payload.data);
        state.message = action.payload.message;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      });
  },
});

export const { resetPayments } = paymentSlice.actions;
export default paymentSlice.reducer;
