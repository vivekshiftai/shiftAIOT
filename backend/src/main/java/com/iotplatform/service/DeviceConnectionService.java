package com.iotplatform.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iotplatform.model.DeviceConnection;
import com.iotplatform.repository.DeviceConnectionRepository;

@Service
public class DeviceConnectionService {

    @Autowired
    private DeviceConnectionRepository deviceConnectionRepository;

    public List<DeviceConnection> getAllConnections(String organizationId) {
        return deviceConnectionRepository.findByOrganizationId(organizationId);
    }

    public Optional<DeviceConnection> getConnection(String deviceId, String organizationId) {
        return deviceConnectionRepository.findByDeviceIdAndOrganizationId(deviceId, organizationId);
    }

    public DeviceConnection createConnection(DeviceConnection connection, String organizationId) {
        connection.setId(UUID.randomUUID().toString());
        connection.setOrganizationId(organizationId);
        connection.setStatus(DeviceConnection.ConnectionStatus.DISCONNECTED);
        return deviceConnectionRepository.save(connection);
    }

    public DeviceConnection updateConnection(String deviceId, DeviceConnection connectionDetails, String organizationId) {
        DeviceConnection connection = deviceConnectionRepository.findByDeviceIdAndOrganizationId(deviceId, organizationId)
                .orElseThrow(() -> new RuntimeException("Device connection not found"));

        connection.setConnectionType(connectionDetails.getConnectionType());
        connection.setBrokerUrl(connectionDetails.getBrokerUrl());
        connection.setUsername(connectionDetails.getUsername());
        connection.setPassword(connectionDetails.getPassword());
        connection.setTopic(connectionDetails.getTopic());
        connection.setPort(connectionDetails.getPort());
        connection.setApiKey(connectionDetails.getApiKey());
        connection.setWebhookUrl(connectionDetails.getWebhookUrl());
        connection.setConfig(connectionDetails.getConfig());

        return deviceConnectionRepository.save(connection);
    }

    public void deleteConnection(String deviceId, String organizationId) {
        Optional<DeviceConnection> connectionOpt = deviceConnectionRepository.findByDeviceIdAndOrganizationId(deviceId, organizationId);
        if (connectionOpt.isPresent()) {
            deviceConnectionRepository.delete(connectionOpt.get());
        }
        // If no connection exists, that's fine - just return without error
    }

    public DeviceConnection connectDevice(String deviceId, String organizationId) {
        Optional<DeviceConnection> connectionOpt = deviceConnectionRepository.findByDeviceIdAndOrganizationId(deviceId, organizationId);
        if (!connectionOpt.isPresent()) {
            throw new RuntimeException("Device connection not found");
        }
        
        DeviceConnection connection = connectionOpt.get();

        // Simulate connection process
        connection.setStatus(DeviceConnection.ConnectionStatus.CONNECTING);
        deviceConnectionRepository.save(connection);

        // Simulate successful connection
        connection.setStatus(DeviceConnection.ConnectionStatus.CONNECTED);
        connection.setLastConnected(LocalDateTime.now());
        return deviceConnectionRepository.save(connection);
    }

    public DeviceConnection disconnectDevice(String deviceId, String organizationId) {
        Optional<DeviceConnection> connectionOpt = deviceConnectionRepository.findByDeviceIdAndOrganizationId(deviceId, organizationId);
        if (!connectionOpt.isPresent()) {
            throw new RuntimeException("Device connection not found");
        }
        
        DeviceConnection connection = connectionOpt.get();

        connection.setStatus(DeviceConnection.ConnectionStatus.DISCONNECTED);
        connection.setLastDisconnected(LocalDateTime.now());
        return deviceConnectionRepository.save(connection);
    }

    public List<DeviceConnection> getActiveConnections(String organizationId) {
        return deviceConnectionRepository.findActiveConnections(organizationId);
    }

    public long getActiveConnectionCount(String organizationId) {
        return deviceConnectionRepository.countActiveConnections(organizationId);
    }

    public List<DeviceConnection> getConnectionsByType(String organizationId, DeviceConnection.ConnectionType type) {
        return deviceConnectionRepository.findByOrganizationIdAndConnectionType(organizationId, type);
    }

    public List<DeviceConnection> getConnectionsByStatus(String organizationId, DeviceConnection.ConnectionStatus status) {
        return deviceConnectionRepository.findByOrganizationIdAndStatus(organizationId, status);
    }
}
