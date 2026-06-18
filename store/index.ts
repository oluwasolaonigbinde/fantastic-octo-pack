import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/auth-slice";
import ProductReducer from "@/store/slices/product-slice";
import categoryReducer from "@/store/slices/category-slice";
import rfqReducer from "@/store/slices/rfq-slice";
import orderReducer from "@/store/slices/order-slice";
import userReducer from "@/store/slices/user-slice";
import serviceRequestReducer from "@/store/slices/service-request-slice";
import walletReducer from "@/store/slices/wallet-slice";
import paymentReducer from "@/store/slices/payment-slice";
import orderDisputeReducer from "@/store/slices/order-dispute-slice";

const reducer = {
  auth: authReducer,
  product: ProductReducer,
  category: categoryReducer,
  rfq: rfqReducer,
  order: orderReducer,
  user: userReducer,
  serviceRequest: serviceRequestReducer,
  wallet: walletReducer,
  payment: paymentReducer,
  orderDispute: orderDisputeReducer,
};

export type RootState = {
  auth: ReturnType<typeof authReducer>;
  product: ReturnType<typeof ProductReducer>;
  category: ReturnType<typeof categoryReducer>;
  rfq: ReturnType<typeof rfqReducer>;
  order: ReturnType<typeof orderReducer>;
  user: ReturnType<typeof userReducer>;
  serviceRequest: ReturnType<typeof serviceRequestReducer>;
  wallet: ReturnType<typeof walletReducer>;
  payment: ReturnType<typeof paymentReducer>;
  orderDispute: ReturnType<typeof orderDisputeReducer>;
};

export const makeStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer,
    preloadedState: preloadedState as RootState | undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST"],
        },
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
