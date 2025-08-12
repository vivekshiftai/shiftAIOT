import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Analytics data interfaces
 */
interface RulePerformance {
  ruleId: string;
  ruleName: string;
  triggerCount: number;
  successRate: number;
  averageResponseTime: number;
  lastTriggered: string;
}

interface MaintenancePerformance {
  taskId: string;
  taskName: string;
  completionRate: number;
  averageCompletionTime: number;
  onTimeCompletionRate: number;
  costEfficiency: number;
}

interface AnomalyDetection {
  id: string;
  deviceId: string;
  deviceName: string;
  anomalyType: 'performance' | 'behavior' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  confidence: number;
}

/**
 * Analytics state interface
 */
interface AnalyticsState {
  rulePerformance: RulePerformance[];
  maintenancePerformance: MaintenancePerformance[];
  anomalies: AnomalyDetection[];
  loading: boolean;
  error: string | null;
  timeRange: '24h' | '7d' | '30d' | '90d';
}

/**
 * Initial state for analytics slice
 */
const initialState: AnalyticsState = {
  rulePerformance: [],
  maintenancePerformance: [],
  anomalies: [],
  loading: false,
  error: null,
  timeRange: '7d',
};

/**
 * Async thunk for fetching rule performance data
 */
export const fetchRulePerformance = createAsyncThunk(
  'analytics/fetchRulePerformance',
  async (timeRange: string) => {
    // Mock data - replace with actual API call
    const mockData: RulePerformance[] = [
      {
        ruleId: '1',
        ruleName: 'Temperature Alert',
        triggerCount: 45,
        successRate: 98.2,
        averageResponseTime: 1.2,
        lastTriggered: '2025-01-13T10:30:00Z',
      },
      {
        ruleId: '2',
        ruleName: 'Humidity Control',
        triggerCount: 32,
        successRate: 95.8,
        averageResponseTime: 0.8,
        lastTriggered: '2025-01-13T09:15:00Z',
      },
    ];
    
    return mockData;
  }
);

/**
 * Async thunk for fetching maintenance performance data
 */
export const fetchMaintenancePerformance = createAsyncThunk(
  'analytics/fetchMaintenancePerformance',
  async (timeRange: string) => {
    // Mock data - replace with actual API call
    const mockData: MaintenancePerformance[] = [
      {
        taskId: '1',
        taskName: 'Sensor Calibration',
        completionRate: 92.5,
        averageCompletionTime: 65,
        onTimeCompletionRate: 88.0,
        costEfficiency: 85.2,
      },
      {
        taskId: '2',
        taskName: 'Filter Replacement',
        completionRate: 96.8,
        averageCompletionTime: 45,
        onTimeCompletionRate: 94.2,
        costEfficiency: 91.5,
      },
    ];
    
    return mockData;
  }
);

/**
 * Async thunk for fetching anomaly detection data
 */
export const fetchAnomalies = createAsyncThunk(
  'analytics/fetchAnomalies',
  async (timeRange: string) => {
    // Mock data - replace with actual API call
    const mockData: AnomalyDetection[] = [
      {
        id: '1',
        deviceId: 'device-001',
        deviceName: 'Temperature Sensor 1',
        anomalyType: 'performance',
        severity: 'medium',
        description: 'Unusual temperature fluctuations detected',
        detectedAt: '2025-01-13T08:45:00Z',
        confidence: 0.85,
      },
      {
        id: '2',
        deviceId: 'device-002',
        deviceName: 'Humidity Sensor 1',
        anomalyType: 'behavior',
        severity: 'low',
        description: 'Slight deviation from normal humidity patterns',
        detectedAt: '2025-01-13T07:20:00Z',
        confidence: 0.72,
      },
    ];
    
    return mockData;
  }
);

/**
 * Analytics slice with reducers and actions
 */
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setTimeRange: (state, action: PayloadAction<AnalyticsState['timeRange']>) => {
      state.timeRange = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rule performance
      .addCase(fetchRulePerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRulePerformance.fulfilled, (state, action) => {
        state.loading = false;
        state.rulePerformance = action.payload;
      })
      .addCase(fetchRulePerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch rule performance';
      })
      // Fetch maintenance performance
      .addCase(fetchMaintenancePerformance.fulfilled, (state, action) => {
        state.maintenancePerformance = action.payload;
      })
      // Fetch anomalies
      .addCase(fetchAnomalies.fulfilled, (state, action) => {
        state.anomalies = action.payload;
      });
  },
});

export const { setTimeRange, clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
export type { MaintenanceTask, MaintenanceStats, RulePerformance, MaintenancePerformance, AnomalyDetection };