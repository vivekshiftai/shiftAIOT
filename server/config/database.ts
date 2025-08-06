import { createClient } from '@supabase/supabase-js';
import { InfluxDB } from '@influxdata/influxdb-client';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// InfluxDB configuration for time-series data
const influxUrl = process.env.INFLUX_URL || 'http://localhost:8086';
const influxToken = process.env.INFLUX_TOKEN || 'your-token';
const influxOrg = process.env.INFLUX_ORG || 'iot-platform';
const influxBucket = process.env.INFLUX_BUCKET || 'telemetry';

export const influxDB = new InfluxDB({ url: influxUrl, token: influxToken });
export const writeApi = influxDB.getWriteApi(influxOrg, influxBucket);
export const queryApi = influxDB.getQueryApi(influxOrg);

// Database initialization
export const initializeDatabase = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('devices').select('count').limit(1);
    if (error && !error.message.includes('relation "devices" does not exist')) {
      throw error;
    }
    
    console.log('✅ Database connections initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};