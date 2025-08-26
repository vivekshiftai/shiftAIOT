package com.iotplatform.service;

import com.iotplatform.dto.TelemetryDataRequest;
import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;
import com.influxdb.client.WriteApiBlocking;
import com.influxdb.client.domain.WritePrecision;
import com.influxdb.client.write.Point;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class TelemetryService {

    @Value("${influxdb.url}")
    private String influxUrl;

    @Value("${influxdb.token}")
    private String influxToken;

    @Value("${influxdb.org}")
    private String influxOrg;

    @Value("${influxdb.bucket}")
    private String influxBucket;

    private InfluxDBClient getInfluxDBClient() {
        return InfluxDBClientFactory.create(influxUrl, influxToken.toCharArray(), influxOrg, influxBucket);
    }

    public void storeTelemetryData(String deviceId, TelemetryDataRequest telemetryData) {
        try (InfluxDBClient client = getInfluxDBClient()) {
            WriteApiBlocking writeApi = client.getWriteApiBlocking();

            Point point = Point.measurement("telemetry")
                    .addTag("device_id", deviceId)
                    .time(Instant.now(), WritePrecision.MS);

            // Add all metrics as fields
            for (Map.Entry<String, Double> entry : telemetryData.getMetrics().entrySet()) {
                point.addField(entry.getKey(), entry.getValue());
            }

            writeApi.writePoint(point);
        } catch (Exception e) {
            // Fallback to in-memory storage or logging
            System.out.println("Failed to store telemetry data in InfluxDB: " + e.getMessage());
            System.out.println("Device: " + deviceId + ", Data: " + telemetryData.getMetrics());
        }
    }

    public String getTelemetryData(String deviceId, String timeRange) {
        try (InfluxDBClient client = getInfluxDBClient()) {
            // TODO: Implement actual InfluxDB query based on deviceId and timeRange
            // This should query the InfluxDB bucket for actual telemetry data
            // Example query: from(bucket: "iot_telemetry") |> range(start: -1h) |> filter(fn: (r) => r["device_id"] == deviceId)
            
            return "[]"; // Return empty array until InfluxDB query is implemented
        } catch (Exception e) {
            System.out.println("Failed to retrieve telemetry data from InfluxDB: " + e.getMessage());
            return "[]"; // Return empty array on error
        }
    }
}