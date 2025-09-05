package com.iotplatform.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration for the IoT Platform Backend
 * Provides comprehensive API documentation with authentication support
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ShiftAIOT Platform API")
                        .description("""
                            Comprehensive IoT Platform Backend API for device management, 
                            maintenance scheduling, notifications, and analytics.
                            
                            ## Features
                            - Device Management & Onboarding
                            - Maintenance Scheduling & Notifications
                            - Real-time Analytics & Monitoring
                            - PDF Processing & Chat Integration
                            - Jira Task Assignment
                            - Push Notifications
                            - User Management & Authentication
                            
                            ## Authentication
                            This API uses JWT Bearer token authentication. 
                            Include the token in the Authorization header: `Bearer <your-token>`
                            """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("ShiftAIOT Team")
                                .email("s.tadikonda@theshiftai.in")
                                .url("https://theshiftai.in"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8100")
                                .description("Development Server"),
                        new Server()
                                .url("https://api.shiftaiot.com")
                                .description("Production Server")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT token obtained from /api/auth/login endpoint")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
