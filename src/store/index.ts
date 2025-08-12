import { configureStore } from '@reduxjs/toolkit';
import deviceSlice from './slices/deviceSlice';
import userSlice from './slices/userSlice';
import analyticsSlice from './slices/analyticsSlice';
import maintenanceSlice from './slices/maintenanceSlice';

/**
 * Redux store configuration with RTK
 * Manages global application state for devices, users, analytics, and maintenance
 */
export const store = configureStore({
  reducer: {
    devices: deviceSlice,
    users: userSlice,
    analytics: analyticsSlice,
    maintenance: maintenanceSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;