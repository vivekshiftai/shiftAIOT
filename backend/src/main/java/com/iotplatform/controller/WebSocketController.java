package com.iotplatform.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.HashMap;

@Controller
public class WebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketController.class);

    /**
     * Handle client subscription requests
     */
    @MessageMapping("/subscribe")
    @SendToUser("/queue/subscription-status")
    public Map<String, Object> handleSubscription(Map<String, Object> subscriptionRequest, 
                                                 SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String user = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : "anonymous";
        
        logger.info("Client subscription request from user: {} (session: {})", user, sessionId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "subscribed");
        response.put("sessionId", sessionId);
        response.put("user", user);
        response.put("timestamp", System.currentTimeMillis());
        
        return response;
    }

    /**
     * Handle client ping/pong for connection health check
     */
    @MessageMapping("/ping")
    @SendToUser("/queue/pong")
    public Map<String, Object> handlePing(SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "pong");
        response.put("sessionId", sessionId);
        response.put("timestamp", System.currentTimeMillis());
        
        return response;
    }

    /**
     * Handle device status update requests from clients
     */
    @MessageMapping("/device/status/update")
    @SendTo("/topic/devices/status-updates")
    public Map<String, Object> handleDeviceStatusUpdate(Map<String, Object> statusUpdate) {
        logger.info("Device status update request received: {}", statusUpdate);
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "DEVICE_STATUS_UPDATE_ACK");
        response.put("status", "received");
        response.put("timestamp", System.currentTimeMillis());
        
        return response;
    }
}
