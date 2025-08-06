package com.iotplatform.service;

import com.iotplatform.dto.DeviceStatsResponse;
import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DeviceService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private TelemetryService telemetryService;

    @Autowired
    private RuleService ruleService;

    public List<Device> getAllDevices(String organizationId) {
        return deviceRepository.findByOrganizationId(organizationId);
    }

    public List<Device> getDevicesByStatus(String organizationId, Device.DeviceStatus status) {
        return deviceRepository.findByOrganizationIdAndStatus(organizationId, status);
    }

    public List<Device> getDevicesByType(String organizationId, Device.DeviceType type) {
        return deviceRepository.findByOrganizationIdAndType(organizationId, type);
    }

    public List<Device> searchDevices(String organizationId, String search) {
        return deviceRepository.findByOrganizationIdAndSearch(organizationId, search);
    }

    public Optional<Device> getDevice(String id, String organizationId) {
        return deviceRepository.findByIdAndOrganizationId(id, organizationId);
    }

    public Device createDevice(Device device, String organizationId) {
        device.setId(UUID.randomUUID().toString());
        device.setOrganizationId(organizationId);
        device.setStatus(Device.DeviceStatus.OFFLINE);
        return deviceRepository.save(device);
    }

    public Device updateDevice(String id, Device deviceDetails, String organizationId) {
        Device device = deviceRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        device.setName(deviceDetails.getName());
        device.setType(deviceDetails.getType());
        device.setLocation(deviceDetails.getLocation());
        device.setProtocol(deviceDetails.getProtocol());
        device.setFirmware(deviceDetails.getFirmware());
        device.setTags(deviceDetails.getTags());
        device.setConfig(deviceDetails.getConfig());

        return deviceRepository.save(device);
    }

    public void deleteDevice(String id, String organizationId) {
        Device device = deviceRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));
        deviceRepository.delete(device);
    }

    public Device updateDeviceStatus(String id, Device.DeviceStatus status, String organizationId) {
        Device device = deviceRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        device.setStatus(status);
        device.setLastSeen(LocalDateTime.now());
        return deviceRepository.save(device);
    }

    public void processTelemetryData(String deviceId, TelemetryDataRequest telemetryData, String organizationId) {
        // Update device with latest telemetry
        Device device = deviceRepository.findByIdAndOrganizationId(deviceId, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        device.setLastSeen(LocalDateTime.now());
        if (telemetryData.getMetrics().containsKey("temperature")) {
            device.setTemperature(telemetryData.getMetrics().get("temperature"));
        }
        if (telemetryData.getMetrics().containsKey("humidity")) {
            device.setHumidity(telemetryData.getMetrics().get("humidity"));
        }
        if (telemetryData.getMetrics().containsKey("batteryLevel")) {
            device.setBatteryLevel(telemetryData.getMetrics().get("batteryLevel").intValue());
        }

        deviceRepository.save(device);

        // Store telemetry data
        telemetryService.storeTelemetryData(deviceId, telemetryData);

        // Evaluate rules
        ruleService.evaluateRules(deviceId, telemetryData, organizationId);
    }

    public DeviceStatsResponse getDeviceStats(String organizationId) {
        long total = deviceRepository.findByOrganizationId(organizationId).size();
        long online = deviceRepository.countByOrganizationIdAndStatus(organizationId, Device.DeviceStatus.ONLINE);
        long offline = deviceRepository.countByOrganizationIdAndStatus(organizationId, Device.DeviceStatus.OFFLINE);
        long warning = deviceRepository.countByOrganizationIdAndStatus(organizationId, Device.DeviceStatus.WARNING);
        long error = deviceRepository.countByOrganizationIdAndStatus(organizationId, Device.DeviceStatus.ERROR);

        return new DeviceStatsResponse(total, online, offline, warning, error);
    }
}