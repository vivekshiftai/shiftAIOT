import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Device } from '../../types';
import { deviceAPI } from '../../services/api';

/**
 * Device state interface for Redux store
 */
interface DeviceState {
  devices: Device[];
  selectedDevice: Device | null;
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: string;
    type: string;
  };
  stats: {
    total: number;
    online: number;
    offline: number;
    warning: number;
    error: number;
  };
}

/**
 * Initial state for device slice
 */
const initialState: DeviceState = {
  devices: [],
  selectedDevice: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    type: 'all',
  },
  stats: {
    total: 0,
    online: 0,
    offline: 0,
    warning: 0,
    error: 0,
  },
};

/**
 * Async thunk for fetching all devices
 */
export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async (filters?: { status?: string; type?: string; search?: string }) => {
    const response = await deviceAPI.getAll(filters);
    return response.data;
  }
);

/**
 * Async thunk for fetching device statistics
 */
export const fetchDeviceStats = createAsyncThunk(
  'devices/fetchStats',
  async () => {
    const response = await deviceAPI.getStats();
    return response.data;
  }
);

/**
 * Async thunk for updating device status
 */
export const updateDeviceStatus = createAsyncThunk(
  'devices/updateStatus',
  async ({ deviceId, status }: { deviceId: string; status: Device['status'] }) => {
    const response = await deviceAPI.updateStatus(deviceId, status);
    return response.data;
  }
);

/**
 * Device slice with reducers and actions
 */
const deviceSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<DeviceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSelectedDevice: (state, action: PayloadAction<Device | null>) => {
      state.selectedDevice = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch devices
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch devices';
      })
      // Fetch device stats
      .addCase(fetchDeviceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Update device status
      .addCase(updateDeviceStatus.fulfilled, (state, action) => {
        const index = state.devices.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.devices[index] = action.payload;
        }
      });
  },
});

export const { setFilters, setSelectedDevice, clearError } = deviceSlice.actions;
export default deviceSlice.reducer;