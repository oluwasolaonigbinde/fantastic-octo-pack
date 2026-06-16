import rfqService from "@/services/rfqService";
import type { Rfq, Quote, RfqDetailResponse } from "@/types/rfq";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface RfqSliceState {
  rfqs: Rfq[] | null;
  currentRfq: RfqDetailResponse | null;
  distributorQuotes: Quote[] | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
}

const initialState: RfqSliceState = {
  rfqs: null,
  currentRfq: null,
  distributorQuotes: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

export const fetchBuyerRfqs = createAsyncThunk(
  "rfq/fetchBuyerRfqs",
  async (token: string, thunkAPI) => {
    try {
      return await rfqService.fetchBuyerRfqs(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch RFQs"
      );
    }
  }
);

export const fetchRfqDetail = createAsyncThunk(
  "rfq/fetchDetail",
  async ({ token, rfqId }: { token: string; rfqId: string }, thunkAPI) => {
    try {
      return await rfqService.fetchRfqDetail(token, rfqId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch RFQ detail"
      );
    }
  }
);

export const fetchDistributorInbox = createAsyncThunk(
  "rfq/fetchDistributorInbox",
  async (token: string, thunkAPI) => {
    try {
      return await rfqService.fetchDistributorInbox(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch inbox"
      );
    }
  }
);

const rfqSlice = createSlice({
  name: "rfq",
  initialState,
  reducers: {
    resetRfq: (state) => {
      state.rfqs = null;
      state.currentRfq = null;
      state.distributorQuotes = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearCurrentRfq: (state) => {
      state.currentRfq = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuyerRfqs.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchBuyerRfqs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.rfqs = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(fetchBuyerRfqs.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(fetchRfqDetail.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchRfqDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentRfq = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(fetchRfqDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(fetchDistributorInbox.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchDistributorInbox.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.distributorQuotes = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(fetchDistributorInbox.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      });
  },
});

export const { resetRfq, clearCurrentRfq } = rfqSlice.actions;
export default rfqSlice.reducer;
