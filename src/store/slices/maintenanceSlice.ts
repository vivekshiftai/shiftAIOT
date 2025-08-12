import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

/**
 * Maintenance task interface
 */
interface MaintenanceTask {
  id: string;
  deviceId: string;
  deviceName: string;
  taskType: 'preventive' | 'corrective' | 'predictive';
  title: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number; // in minutes
  assignedTo?: string;
  notes?: string;
}

/**
 * Maintenance statistics interface
 */
interface MaintenanceStats {
  totalTasks: number;
  completedThisWeek: number;
  upcomingTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  successRate: number;
}

/**
 * Maintenance state interface
 */
interface MaintenanceState {
  tasks: MaintenanceTask[];
  stats: MaintenanceStats;
  loading: boolean;
  error: string | null;
  filters: {
    status: string;
    priority: string;
    deviceId: string;
  };
}

/**
 * Initial state for maintenance slice
 */
const initialState: MaintenanceState = {
  tasks: [],
  stats: {
    totalTasks: 0,
    completedThisWeek: 0,
    upcomingTasks: 0,
    overdueTasks: 0,
    averageCompletionTime: 0,
    successRate: 0,
  },
  loading: false,
  error: null,
  filters: {
    status: 'all',
    priority: 'all',
    deviceId: 'all',
  },
};

/**
 * Async thunk for fetching maintenance tasks
 */
export const fetchMaintenanceTasks = createAsyncThunk(
  'maintenance/fetchTasks',
  async (filters?: { status?: string; priority?: string; deviceId?: string }) => {
    // Mock data - replace with actual API call
    const mockTasks: MaintenanceTask[] = [
      {
        id: '1',
        deviceId: 'device-001',
        deviceName: 'Temperature Sensor 1',
        taskType: 'preventive',
        title: 'Quarterly Calibration',
        description: 'Perform quarterly calibration check and adjustment',
        scheduledDate: '2025-01-20T10:00:00Z',
        status: 'pending',
        priority: 'medium',
        estimatedDuration: 60,
        assignedTo: 'John Smith',
      },
      {
        id: '2',
        deviceId: 'device-002',
        deviceName: 'Humidity Sensor 1',
        taskType: 'corrective',
        title: 'Replace Sensor Element',
        description: 'Replace faulty humidity sensor element',
        scheduledDate: '2025-01-15T14:00:00Z',
        completedDate: '2025-01-15T15:30:00Z',
        status: 'completed',
        priority: 'high',
        estimatedDuration: 90,
        assignedTo: 'Jane Doe',
      },
    ];
    
    return mockTasks;
  }
);

/**
 * Async thunk for fetching maintenance statistics
 */
export const fetchMaintenanceStats = createAsyncThunk(
  'maintenance/fetchStats',
  async () => {
    // Mock data - replace with actual API call
    const mockStats: MaintenanceStats = {
      totalTasks: 24,
      completedThisWeek: 8,
      upcomingTasks: 6,
      overdueTasks: 2,
      averageCompletionTime: 75,
      successRate: 92.5,
    };
    
    return mockStats;
  }
);

/**
 * Maintenance slice with reducers and actions
 */
const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<MaintenanceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch maintenance tasks
      .addCase(fetchMaintenanceTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchMaintenanceTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch maintenance tasks';
      })
      // Fetch maintenance stats
      .addCase(fetchMaintenanceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { setFilters, clearError } = maintenanceSlice.actions;
export default maintenanceSlice.reducer;
export type { MaintenanceTask, MaintenanceStats };