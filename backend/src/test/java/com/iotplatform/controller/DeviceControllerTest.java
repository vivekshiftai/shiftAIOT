package com.iotplatform.controller;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iotplatform.dto.DeviceCreateResponse;
import com.iotplatform.dto.DeviceCreateWithFileRequest;
import com.iotplatform.dto.DeviceStatsResponse;
import com.iotplatform.model.Device;
import com.iotplatform.model.User;
import com.iotplatform.service.DeviceService;
import com.iotplatform.service.FileStorageService;
import com.iotplatform.service.TelemetryService;

@WebMvcTest(DeviceController.class)
public class DeviceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DeviceService deviceService;

    @MockBean
    private TelemetryService telemetryService;

    @MockBean
    private FileStorageService fileStorageService;

    private ObjectMapper objectMapper;
    private User testUser;
    private Device testDevice;
    private DeviceCreateWithFileRequest testRequest;
    private DeviceCreateResponse testResponse;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        
        // Setup test user
        testUser = new User();
        testUser.setId("user-123");
        testUser.setEmail("test@example.com");
        testUser.setOrganizationId("org-123");
        
        // Setup test device
        testDevice = new Device();
        testDevice.setId("device-123");
        testDevice.setName("Temperature Sensor 001");
        testDevice.setType(Device.DeviceType.SENSOR);
        testDevice.setStatus(Device.DeviceStatus.OFFLINE);
        testDevice.setLocation("Building A, Floor 2, Room 205");
        testDevice.setProtocol(Device.Protocol.MQTT);
        testDevice.setFirmware("v2.1.0");
        testDevice.setTags(Arrays.asList("temperature", "environmental", "sensor"));
        testDevice.setManufacturer("Siemens");
        testDevice.setModel("ST-2000");
        testDevice.setSerialNumber("SN123456789");
        testDevice.setMacAddress("00:11:22:33:44:55");
        testDevice.setIpAddress("192.168.1.100");
        testDevice.setPort(1883);
        testDevice.setDescription("Industrial temperature sensor for HVAC monitoring");
        testDevice.setInstallationNotes("Install at 2m height, avoid direct sunlight");
        testDevice.setMaintenanceSchedule("Quarterly calibration required");
        testDevice.setWarrantyInfo("2 years manufacturer warranty");
        testDevice.setWifiSsid("IoT_Network");
        testDevice.setMqttBroker("mqtt.broker.com");
        testDevice.setMqttTopic("sensors/temperature/001");
        testDevice.setPowerSource("24V DC");
        testDevice.setPowerConsumption(5.2);
        testDevice.setOperatingTemperatureMin(-10.0);
        testDevice.setOperatingTemperatureMax(50.0);
        testDevice.setOperatingHumidityMin(10.0);
        testDevice.setOperatingHumidityMax(90.0);
        testDevice.setManualUrl("/uploads/devices/device-123/manual.pdf");
        testDevice.setDatasheetUrl("/uploads/devices/device-123/datasheet.pdf");
        testDevice.setCertificateUrl("/uploads/devices/device-123/certificate.pdf");
        testDevice.setCreatedAt(LocalDateTime.now());
        testDevice.setUpdatedAt(LocalDateTime.now());
        testDevice.setOrganizationId("org-123");
        
        // Setup test request
        testRequest = new DeviceCreateWithFileRequest();
        testRequest.setName("Temperature Sensor 001");
        testRequest.setType(Device.DeviceType.SENSOR);
        testRequest.setLocation("Building A, Floor 2, Room 205");
        testRequest.setProtocol(Device.Protocol.MQTT);
        testRequest.setFirmware("v2.1.0");
        testRequest.setTags(Arrays.asList("temperature", "environmental", "sensor"));
        testRequest.setManufacturer("Siemens");
        testRequest.setModel("ST-2000");
        testRequest.setSerialNumber("SN123456789");
        testRequest.setMacAddress("00:11:22:33:44:55");
        testRequest.setIpAddress("192.168.1.100");
        testRequest.setPort(1883);
        testRequest.setDescription("Industrial temperature sensor for HVAC monitoring");
        testRequest.setInstallationNotes("Install at 2m height, avoid direct sunlight");
        testRequest.setMaintenanceSchedule("Quarterly calibration required");
        testRequest.setWarrantyInfo("2 years manufacturer warranty");
        testRequest.setWifiSsid("IoT_Network");
        testRequest.setMqttBroker("mqtt.broker.com");
        testRequest.setMqttTopic("sensors/temperature/001");
        testRequest.setPowerSource("24V DC");
        testRequest.setPowerConsumption(5.2);
        testRequest.setOperatingTemperatureMin(-10.0);
        testRequest.setOperatingTemperatureMax(50.0);
        testRequest.setOperatingHumidityMin(10.0);
        testRequest.setOperatingHumidityMax(90.0);
        
        // Setup test response
        testResponse = new DeviceCreateResponse();
        testResponse.setId("device-123");
        testResponse.setName("Temperature Sensor 001");
        testResponse.setType(Device.DeviceType.SENSOR);
        testResponse.setStatus(Device.DeviceStatus.OFFLINE);
        testResponse.setLocation("Building A, Floor 2, Room 205");
        testResponse.setProtocol(Device.Protocol.MQTT);
        testResponse.setFirmware("v2.1.0");
        testResponse.setTags(Arrays.asList("temperature", "environmental", "sensor"));
        testResponse.setManufacturer("Siemens");
        testResponse.setModel("ST-2000");
        testResponse.setSerialNumber("SN123456789");
        testResponse.setMacAddress("00:11:22:33:44:55");
        testResponse.setIpAddress("192.168.1.100");
        testResponse.setPort(1883);
        testResponse.setManualUrl("/uploads/devices/device-123/manual.pdf");
        testResponse.setDatasheetUrl("/uploads/devices/device-123/datasheet.pdf");
        testResponse.setCertificateUrl("/uploads/devices/device-123/certificate.pdf");
        testResponse.setDescription("Industrial temperature sensor for HVAC monitoring");
        testResponse.setInstallationNotes("Install at 2m height, avoid direct sunlight");
        testResponse.setMaintenanceSchedule("Quarterly calibration required");
        testResponse.setWarrantyInfo("2 years manufacturer warranty");
        testResponse.setWifiSsid("IoT_Network");
        testResponse.setMqttBroker("mqtt.broker.com");
        testResponse.setMqttTopic("sensors/temperature/001");
        testResponse.setPowerSource("24V DC");
        testResponse.setPowerConsumption(5.2);
        testResponse.setOperatingTemperatureMin(-10.0);
        testResponse.setOperatingTemperatureMax(50.0);
        testResponse.setOperatingHumidityMin(10.0);
        testResponse.setOperatingHumidityMax(90.0);
        testResponse.setCreatedAt(LocalDateTime.now());
        testResponse.setUpdatedAt(LocalDateTime.now());
        testResponse.setManualUploaded(true);
        testResponse.setDatasheetUploaded(true);
        testResponse.setCertificateUploaded(true);
    }

    @Test
    @WithMockUser(authorities = "DEVICE_READ")
    void testGetDeviceStats_Success() throws Exception {
        // Given
        DeviceStatsResponse statsResponse = new DeviceStatsResponse(10, 7, 3, 0, 0);
        
        when(deviceService.getDeviceStats("org-123"))
            .thenReturn(statsResponse);
        
        // When & Then
        mockMvc.perform(get("/devices/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(10))
                .andExpect(jsonPath("$.online").value(7))
                .andExpect(jsonPath("$.offline").value(3))
                .andExpect(jsonPath("$.warning").value(0))
                .andExpect(jsonPath("$.error").value(0));
    }

    @Test
    @WithMockUser(authorities = "DEVICE_READ")
    void testGetAllDevices_Success() throws Exception {
        // Given
        when(deviceService.getAllDevices("org-123"))
            .thenReturn(Arrays.asList(testDevice));
        
        // When & Then
        mockMvc.perform(get("/devices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("device-123"))
                .andExpect(jsonPath("$[0].name").value("Temperature Sensor 001"))
                .andExpect(jsonPath("$[0].type").value("SENSOR"))
                .andExpect(jsonPath("$[0].status").value("OFFLINE"));
    }

    @Test
    @WithMockUser(authorities = "DEVICE_READ")
    void testGetDevice_Success() throws Exception {
        // Given
        when(deviceService.getDevice("device-123", "org-123"))
            .thenReturn(Optional.of(testDevice));
        
        // When & Then
        mockMvc.perform(get("/devices/device-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("device-123"))
                .andExpect(jsonPath("$.name").value("Temperature Sensor 001"))
                .andExpect(jsonPath("$.type").value("SENSOR"))
                .andExpect(jsonPath("$.status").value("OFFLINE"));
    }

    @Test
    @WithMockUser(authorities = "DEVICE_READ")
    void testGetDevice_NotFound() throws Exception {
        // Given
        when(deviceService.getDevice("nonexistent", "org-123"))
            .thenReturn(Optional.empty());
        
        // When & Then
        mockMvc.perform(get("/devices/nonexistent"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "DEVICE_READ")
    void testGetDeviceDocumentationInfo_Success() throws Exception {
        // Given
        when(deviceService.getDevice("device-123", "org-123"))
            .thenReturn(Optional.of(testDevice));
        when(fileStorageService.getFileSize("/uploads/devices/device-123/manual.pdf"))
            .thenReturn(1024L);
        when(fileStorageService.getFileSize("/uploads/devices/device-123/datasheet.pdf"))
            .thenReturn(2048L);
        when(fileStorageService.getFileSize("/uploads/devices/device-123/certificate.pdf"))
            .thenReturn(3072L);
        
        // When & Then
        mockMvc.perform(get("/devices/device-123/documentation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceId").value("device-123"))
                .andExpect(jsonPath("$.deviceName").value("Temperature Sensor 001"))
                .andExpect(jsonPath("$.files.manual.available").value(true))
                .andExpect(jsonPath("$.files.manual.url").value("/devices/device-123/documentation/manual"))
                .andExpect(jsonPath("$.files.manual.size").value(1024))
                .andExpect(jsonPath("$.files.datasheet.available").value(true))
                .andExpect(jsonPath("$.files.datasheet.url").value("/devices/device-123/documentation/datasheet"))
                .andExpect(jsonPath("$.files.datasheet.size").value(2048))
                .andExpect(jsonPath("$.files.certificate.available").value(true))
                .andExpect(jsonPath("$.files.certificate.url").value("/devices/device-123/documentation/certificate"))
                .andExpect(jsonPath("$.files.certificate.size").value(3072));
    }

    @Test
    @WithMockUser(authorities = "DEVICE_READ")
    void testGetDeviceDocumentationInfo_DeviceNotFound() throws Exception {
        // Given
        when(deviceService.getDevice("nonexistent", "org-123"))
            .thenReturn(Optional.empty());
        
        // When & Then
        mockMvc.perform(get("/devices/nonexistent/documentation"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "DEVICE_READ")
    void testDownloadDeviceDocumentation_Success() throws Exception {
        // Given
        when(deviceService.getDevice("device-123", "org-123"))
            .thenReturn(Optional.of(testDevice));
        when(fileStorageService.loadFile("/uploads/devices/device-123/manual.pdf"))
            .thenReturn("Test manual content".getBytes());
        when(fileStorageService.getFileType("manual.pdf"))
            .thenReturn("application/pdf");
        
        // When & Then
        mockMvc.perform(get("/devices/device-123/documentation/manual"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"));
    }

    @Test
    @WithMockUser(authorities = "DEVICE_READ")
    void testDownloadDeviceDocumentation_InvalidType() throws Exception {
        // When & Then
        mockMvc.perform(get("/devices/device-123/documentation/invalid"))
                .andExpect(status().isBadRequest());
    }
}
