import orderService from "@/services/orderService";
import type { Order } from "@/types/order";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface OrderSliceState {
  orders: Order[] | null;
  currentOrder: Order | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
}

const initialState: OrderSliceState = {
  orders: null,
  currentOrder: null,
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
      });
  },
});

export const { resetOrders, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
