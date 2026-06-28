import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import subscriptionService from "@/services/subscriptionService";
import type {
  PlansQuery,
  Subscription,
  SubscriptionEntitlements,
  SubscriptionPlan,
} from "@/types/subscription";

interface SubscriptionSliceState {
  plans: SubscriptionPlan[] | null;
  subscription: Subscription | null;
  entitlements: SubscriptionEntitlements | null;
  /** Loading the plan catalogue or the caller's subscription. */
  isLoading: boolean;
  /** A subscribe/cancel mutation is in flight. */
  isMutating: boolean;
  isError: boolean;
  message: string;
}

const initialState: SubscriptionSliceState = {
  plans: null,
  subscription: null,
  entitlements: null,
  isLoading: false,
  isMutating: false,
  isError: false,
  message: "",
};

export const fetchSubscriptionPlans = createAsyncThunk(
  "subscription/fetchPlans",
  async (
    { token, query }: { token: string; query?: PlansQuery },
    thunkAPI,
  ) => {
    try {
      const res = await subscriptionService.fetchPlans(token, query);
      return res.data.docs;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch plans",
      );
    }
  },
);

export const fetchMySubscription = createAsyncThunk(
  "subscription/fetchMine",
  async (token: string, thunkAPI) => {
    try {
      const res = await subscriptionService.fetchMySubscription(token);
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch subscription",
      );
    }
  },
);

export const subscribeToPlan = createAsyncThunk(
  "subscription/subscribe",
  async ({ token, planId }: { token: string; planId: string }, thunkAPI) => {
    try {
      const res = await subscriptionService.subscribe(token, { planId });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to subscribe to plan",
      );
    }
  },
);

export const cancelSubscription = createAsyncThunk(
  "subscription/cancel",
  async (token: string, thunkAPI) => {
    try {
      const res = await subscriptionService.cancelSubscription(token);
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to cancel subscription",
      );
    }
  },
);

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    resetSubscription: () => initialState,
    clearSubscriptionError: (state) => {
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(fetchMySubscription.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchMySubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload.subscription;
        state.entitlements = action.payload.entitlements;
      })
      .addCase(fetchMySubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(subscribeToPlan.pending, (state) => {
        state.isMutating = true;
        state.isError = false;
      })
      .addCase(subscribeToPlan.fulfilled, (state, action) => {
        state.isMutating = false;
        state.subscription = action.payload.subscription;
      })
      .addCase(subscribeToPlan.rejected, (state, action) => {
        state.isMutating = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(cancelSubscription.pending, (state) => {
        state.isMutating = true;
        state.isError = false;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isMutating = false;
        state.subscription = action.payload;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isMutating = false;
        state.isError = true;
        state.message = action.payload as string;
      });
  },
});

export const { resetSubscription, clearSubscriptionError } =
  subscriptionSlice.actions;
export default subscriptionSlice.reducer;
