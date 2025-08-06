import { supabase } from '../config/database';
import { writeApi, queryApi } from '../config/database';
import { Point } from '@influxdata/influxdb-client';
import { v4 as uuidv4 } from 'uuid';

export interface Device {
  id: string;
  name: string;
  type: 'sensor' | 'actuator' | 'gateway' | 'controller';
  status: 'online' | 'offline' | 'warning' | 'error';
  location: string;
  protocol: 'MQTT' | 'HTTP' | 'CoAP';
  firmware: string;
  tags: string[];
  config: any;
  created_at: string;
  updated_at: string;
  last_seen: string;
  battery_level?: number;
  organization_id: string;
}

export interface TelemetryData {
  device_id: string;
  timestamp: string;
  metrics: Record<string, number>;
}

export class DeviceService {
  async createDevice(deviceData: Partial<Device>, organizationId: string): Promise<Device> {
    const device = {
      id: uuidv4(),
      ...deviceData,
      status: 'offline' as const,
      organization_id: organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('devices')
      .insert([device])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDevices(organizationId: string, filters?: any): Promise<Device[]> {
    let query = supabase
      .from('devices')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getDevice(deviceId: string, organizationId: string): Promise<Device | null> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async updateDevice(deviceId: string, updates: Partial<Device>, organizationId: string): Promise<Device> {
    const { data, error } = await supabase
      .from('devices')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDevice(deviceId: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  }

  async updateDeviceStatus(deviceId: string, status: Device['status'], organizationId: string): Promise<void> {
    await this.updateDevice(deviceId, {
      status,
      last_seen: new Date().toISOString()
    }, organizationId);
  }

  async storeTelemetryData(data: TelemetryData): Promise<void> {
    // Store in InfluxDB for time-series data
    const point = new Point('telemetry')
      .tag('device_id', data.device_id)
      .timestamp(new Date(data.timestamp));

    // Add all metrics as fields
    Object.entries(data.metrics).forEach(([key, value]) => {
      point.floatField(key, value);
    });

    writeApi.writePoint(point);
    await writeApi.flush();

    // Update device last_seen
    await supabase
      .from('devices')
      .update({ last_seen: data.timestamp })
      .eq('id', data.device_id);
  }

  async getTelemetryData(deviceId: string, timeRange: string = '1h'): Promise<any[]> {
    const query = `
      from(bucket: "${process.env.INFLUX_BUCKET || 'telemetry'}")
        |> range(start: -${timeRange})
        |> filter(fn: (r) => r["_measurement"] == "telemetry")
        |> filter(fn: (r) => r["device_id"] == "${deviceId}")
        |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
        |> yield(name: "mean")
    `;

    const result: any[] = [];
    
    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          result.push(o);
        },
        error(error) {
          reject(error);
        },
        complete() {
          resolve(result);
        },
      });
    });
  }

  async getDeviceStats(organizationId: string): Promise<any> {
    const { data: devices, error } = await supabase
      .from('devices')
      .select('status')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const stats = {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      warning: devices.filter(d => d.status === 'warning').length,
      error: devices.filter(d => d.status === 'error').length
    };

    return stats;
  }
}

export const deviceService = new DeviceService();