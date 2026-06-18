import orderDisputeService from "@/services/orderDisputeService";
import type {
  CreateOrderDisputePayload,
  OrderDispute,
  ResolveOrderDisputePayload,
} from "@/types/order-dispute";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface OrderDisputeSliceState {
  disputes: OrderDispute[] | null;
  currentDispute: OrderDispute | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
}

const initialState: OrderDisputeSliceState = {
  disputes: null,
  currentDispute: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

const normalizeDisputesPayload = (payload: unknown): OrderDispute[] => {
  if (Array.isArray(payload)) {
    return payload as OrderDispute[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "docs" in payload &&
    Array.isArray((payload as { docs?: unknown }).docs)
  ) {
    return (payload as { docs: OrderDispute[] }).docs;
  }

  return [];
};

export const createOrderDispute = createAsyncThunk(
  "orderDispute/create",
  async (
    {
      token,
      orderId,
      payload,
      file,
    }: {
      token: string;
      orderId: string;
      payload: CreateOrderDisputePayload;
      file?: File;
    },
    thunkAPI
  ) => {
    try {
      return await orderDisputeService.createOrderDispute(
        token,
        orderId,
        payload,
        file
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to raise order dispute"
      );
    }
  }
);

export const fetchOrderDisputes = createAsyncThunk(
  "orderDispute/fetchAll",
  async (token: string, thunkAPI) => {
    try {
      return await orderDisputeService.fetchOrderDisputes(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch order disputes"
      );
    }
  }
);

export const fetchOrderDisputeById = createAsyncThunk(
  "orderDispute/fetchById",
  async ({ token, disputeId }: { token: string; disputeId: string }, thunkAPI) => {
    try {
      return await orderDisputeService.fetchOrderDisputeById(token, disputeId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch order dispute"
      );
    }
  }
);

export const addOrderDisputeComment = createAsyncThunk(
  "orderDispute/addComment",
  async (
    { token, disputeId, text }: { token: string; disputeId: string; text: string },
    thunkAPI
  ) => {
    try {
      return await orderDisputeService.addOrderDisputeComment(
        token,
        disputeId,
        text
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to add dispute comment"
      );
    }
  }
);

export const addOrderDisputeEvidence = createAsyncThunk(
  "orderDispute/addEvidence",
  async (
    { token, disputeId, file }: { token: string; disputeId: string; file: File },
    thunkAPI
  ) => {
    try {
      return await orderDisputeService.addOrderDisputeEvidence(
        token,
        disputeId,
        file
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to upload dispute evidence"
      );
    }
  }
);

export const requestOrderDisputeEvidence = createAsyncThunk(
  "orderDispute/requestEvidence",
  async (
    { token, disputeId, note }: { token: string; disputeId: string; note?: string },
    thunkAPI
  ) => {
    try {
      return await orderDisputeService.requestOrderDisputeEvidence(
        token,
        disputeId,
        note
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to request more evidence"
      );
    }
  }
);

export const resolveOrderDispute = createAsyncThunk(
  "orderDispute/resolve",
  async (
    {
      token,
      disputeId,
      payload,
    }: { token: string; disputeId: string; payload: ResolveOrderDisputePayload },
    thunkAPI
  ) => {
    try {
      return await orderDisputeService.resolveOrderDispute(
        token,
        disputeId,
        payload
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to resolve order dispute"
      );
    }
  }
);

const upsertDispute = (
  disputes: OrderDispute[] | null,
  dispute: OrderDispute
): OrderDispute[] => {
  if (!disputes) return [dispute];
  const index = disputes.findIndex((item) => item._id === dispute._id);
  if (index === -1) return [dispute, ...disputes];
  const next = [...disputes];
  next[index] = dispute;
  return next;
};

const orderDisputeSlice = createSlice({
  name: "orderDispute",
  initialState,
  reducers: {
    resetOrderDisputes: (state) => {
      state.disputes = null;
      state.currentDispute = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearCurrentOrderDispute: (state) => {
      state.currentDispute = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderDisputes.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchOrderDisputes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.disputes = normalizeDisputesPayload(action.payload.data);
        state.message = action.payload.message;
      })
      .addCase(fetchOrderDisputes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(fetchOrderDisputeById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchOrderDisputeById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentDispute = action.payload;
      })
      .addCase(fetchOrderDisputeById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      });

    // Mutations that return the updated dispute share fulfilled handling.
    for (const thunk of [
      createOrderDispute,
      addOrderDisputeComment,
      addOrderDisputeEvidence,
      requestOrderDisputeEvidence,
      resolveOrderDispute,
    ]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.isLoading = true;
          state.isError = false;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.currentDispute = action.payload;
          state.disputes = upsertDispute(state.disputes, action.payload);
        })
        .addCase(thunk.rejected, (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload as string;
        });
    }
  },
});

export const { resetOrderDisputes, clearCurrentOrderDispute } =
  orderDisputeSlice.actions;
export default orderDisputeSlice.reducer;
