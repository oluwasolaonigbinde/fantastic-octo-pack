import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/auth-slice";
import userReducer from "@/store/slices/user-slice";

const reducer = {
  auth: authReducer,
  user: userReducer,
};

export type RootState = {
  auth: ReturnType<typeof authReducer>;
  user: ReturnType<typeof userReducer>;
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
