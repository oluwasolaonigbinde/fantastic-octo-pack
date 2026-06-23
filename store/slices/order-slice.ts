import orderService from "@/services/orderService";
import type {
  EscrowSummary,
  Order,
  OrderPaymentResult,
  PayOrderPayload,
} from "@/types/order";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface OrderSliceState {
  orders: Order[] | null;
  currentOrder: Order | null;
  escrowSummary: EscrowSummary | null;
  escrowLoading: boolean;
  payResult: OrderPaymentResult | null;
  paySuccess: boolean;
  isPaying: boolean;
  isConfirming: boolean;
  confirmError: string;
  isFulfilling: boolean;
  fulfillError: string;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
}

const initialState: OrderSliceState = {
  orders: null,
  currentOrder: null,
  escrowSummary: null,
  escrowLoading: false,
  payResult: null,
  paySuccess: false,
  isPaying: false,
  isConfirming: false,
  confirmError: "",
  isFulfilling: false,
  fulfillError: "",
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

const normalizeOrdersPayload = (payload: unknown): Order[] => {
  if (Array.isArray(payload)) {
    return payload as Order[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "docs" in payload &&
    Array.isArray((payload as { docs?: unknown }).docs)
  ) {
    return (payload as { docs: Order[] }).docs;
  }

  return [];
};

export const fetchOrders = createAsyncThunk(
  "order/fetchAll",
  async (token: string, thunkAPI) => {
    try {
      return await orderService.fetchOrders(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch orders"
      );
    }
  }
);

export const fetchOrderDetail = createAsyncThunk(
  "order/fetchDetail",
  async ({ token, orderId }: { token: string; orderId: string }, thunkAPI) => {
    try {
      return await orderService.fetchOrderDetail(token, orderId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch order detail"
      );
    }
  }
);

export const payOrder = createAsyncThunk(
  "order/pay",
  async (
    {
      token,
      orderId,
      payload,
    }: { token: string; orderId: string; payload: PayOrderPayload },
    thunkAPI
  ) => {
    try {
      const res = await orderService.payOrder(token, orderId, payload);
      // Surface the raw gateway/escrow response so the rail (wallet vs paystack)
      // and any reference/redirect fields are visible while integrating.
      console.log("[payOrder] response", { orderId, payload, response: res });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to process payment"
      );
    }
  }
);

export const confirmOrderReceipt = createAsyncThunk(
  "order/confirmReceipt",
  async ({ token, orderId }: { token: string; orderId: string }, thunkAPI) => {
    try {
      const res = await orderService.markOrderReceived(token, orderId);
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to confirm receipt"
      );
    }
  }
);

export const fulfillOrder = createAsyncThunk(
  "order/fulfill",
  async ({ token, orderId }: { token: string; orderId: string }, thunkAPI) => {
    try {
      const res = await orderService.fulfillOrder(token, orderId);
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to mark order fulfilled"
      );
    }
  }
);

export const fetchEscrowSummary = createAsyncThunk(
  "order/fetchEscrowSummary",
  async (token: string, thunkAPI) => {
    try {
      return await orderService.fetchEscrowSummary(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch escrow summary"
      );
    }
  }
);

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    resetOrders: (state) => {
      state.orders = null;
      state.currentOrder = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearOrderPayment: (state) => {
      state.payResult = null;
      state.paySuccess = false;
      state.isPaying = false;
    },
    clearConfirmReceipt: (state) => {
      state.isConfirming = false;
      state.confirmError = "";
    },
    clearFulfill: (state) => {
      state.isFulfilling = false;
      state.fulfillError = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.orders = normalizeOrdersPayload(action.payload.data);
        state.message = action.payload.message;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(fetchOrderDetail.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentOrder = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(payOrder.pending, (state) => {
        state.isPaying = true;
        state.isError = false;
        state.paySuccess = false;
        state.message = "";
      })
      .addCase(payOrder.fulfilled, (state, action) => {
        state.isPaying = false;
        state.isSuccess = true;
        state.paySuccess = true;
        state.payResult = action.payload ?? null;
        // Wallet payments settle inline and may echo the updated order.
        if (action.payload?.order) {
          state.currentOrder = action.payload.order;
        }
      })
      .addCase(payOrder.rejected, (state) => {
        // Keep payment failures out of the shared `isError`/`message` fields so
        // they don't masquerade as an order-load error during a refetch. The
        // useOrderPayment hook captures this error locally via unwrap().
        state.isPaying = false;
        state.paySuccess = false;
      })
      .addCase(confirmOrderReceipt.pending, (state) => {
        state.isConfirming = true;
        state.confirmError = "";
      })
      .addCase(confirmOrderReceipt.fulfilled, (state, action) => {
        state.isConfirming = false;
        state.currentOrder = action.payload;
      })
      .addCase(confirmOrderReceipt.rejected, (state, action) => {
        state.isConfirming = false;
        state.confirmError = action.payload as string;
      })
      .addCase(fulfillOrder.pending, (state) => {
        state.isFulfilling = true;
        state.fulfillError = "";
      })
      .addCase(fulfillOrder.fulfilled, (state, action) => {
        state.isFulfilling = false;
        state.currentOrder = action.payload;
      })
      .addCase(fulfillOrder.rejected, (state, action) => {
        state.isFulfilling = false;
        state.fulfillError = action.payload as string;
      })
      .addCase(fetchEscrowSummary.pending, (state) => {
        state.escrowLoading = true;
      })
      .addCase(fetchEscrowSummary.fulfilled, (state, action) => {
        state.escrowLoading = false;
        state.escrowSummary = action.payload.data;
      })
      .addCase(fetchEscrowSummary.rejected, (state) => {
        state.escrowLoading = false;
      });
  },
});

export const {
  resetOrders,
  clearCurrentOrder,
  clearOrderPayment,
  clearConfirmReceipt,
  clearFulfill,
} = orderSlice.actions;
export default orderSlice.reducer;
