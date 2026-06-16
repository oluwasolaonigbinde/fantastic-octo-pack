import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import serviceRequestService from "@/services/serviceRequestService";
import {
  CreateServiceRequestPayload,
  ServiceRequestData,
  ServiceRequestListResponse,
  ServiceRequestResponse,
  ServiceRequestStatus,
  ServiceRequestStatusCounts,
  UpdateServiceRequestStatusPayload,
} from "@/types/service-request";

interface ServiceRequestState {
  serviceRequests: ServiceRequestData[];
  selectedRequest: ServiceRequestData | null;
  statusCounts: ServiceRequestStatusCounts | null;
  isLoading: boolean;
  isError: boolean;
}

const initialState: ServiceRequestState = {
  serviceRequests: [],
  selectedRequest: null,
  statusCounts: null,
  isLoading: false,
  isError: false,
};

export const createServiceRequest = createAsyncThunk<
  ServiceRequestResponse,
  {
    token: string;
    data: CreateServiceRequestPayload | FormData;
  }
>("serviceRequest/create", async ({ token, data }, thunkAPI) => {
  try {
    return await serviceRequestService.createServiceRequest(token, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Failed to create service request"
    );
  }
});

export const fetchServiceRequests = createAsyncThunk<
  ServiceRequestListResponse,
  {
    token: string;
    params?: { page?: number; limit?: number; status?: ServiceRequestStatus };
  }
>("serviceRequest/fetchAll", async ({ token, params }, thunkAPI) => {
  try {
    return await serviceRequestService.fetchServiceRequests(token, params);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Failed to fetch service requests"
    );
  }
});

export const fetchServiceRequestById = createAsyncThunk<
  ServiceRequestResponse,
  { token: string; id: string }
>("serviceRequest/fetchById", async ({ token, id }, thunkAPI) => {
  try {
    return await serviceRequestService.fetchServiceRequestById(token, id);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Failed to fetch service request"
    );
  }
});

export const buyerMarkCompleted = createAsyncThunk<
  ServiceRequestResponse,
  { token: string; id: string }
>("serviceRequest/buyerMarkCompleted", async ({ token, id }, thunkAPI) => {
  try {
    return await serviceRequestService.buyerMarkCompleted(token, id);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to mark service request as completed"
    );
  }
});

export const updateServiceRequestStatus = createAsyncThunk<
  ServiceRequestResponse,
  { token: string; id: string; payload: UpdateServiceRequestStatusPayload }
>("serviceRequest/updateStatus", async ({ token, id, payload }, thunkAPI) => {
  try {
    return await serviceRequestService.updateServiceRequestStatus(
      token,
      id,
      payload
    );
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to update service request status"
    );
  }
});

const serviceRequestSlice = createSlice({
  name: "serviceRequest",
  initialState,
  reducers: {
    resetServiceRequestState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createServiceRequest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(createServiceRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceRequests.push(action.payload.data);
      })
      .addCase(createServiceRequest.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      .addCase(fetchServiceRequests.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchServiceRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceRequests = action.payload.data.docs;
        state.statusCounts = action.payload.data.statusCounts ?? null;
      })
      .addCase(fetchServiceRequests.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      .addCase(fetchServiceRequestById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchServiceRequestById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedRequest = action.payload.data;
      })
      .addCase(fetchServiceRequestById.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      .addCase(buyerMarkCompleted.fulfilled, (state, action) => {
        state.selectedRequest = action.payload.data;
        const id = String(action.payload.data._id);
        const idx = state.serviceRequests.findIndex((r) => String(r._id) === id);
        if (idx !== -1) {
          state.serviceRequests[idx] = action.payload.data;
        }
      })
      .addCase(updateServiceRequestStatus.fulfilled, (state, action) => {
        state.selectedRequest = action.payload.data;
        const id = String(action.payload.data._id);
        const idx = state.serviceRequests.findIndex((r) => String(r._id) === id);
        if (idx !== -1) {
          state.serviceRequests[idx] = action.payload.data;
        } else {
          state.serviceRequests.push(action.payload.data);
        }
      });
  },
});

export const { resetServiceRequestState } = serviceRequestSlice.actions;
export default serviceRequestSlice.reducer;
