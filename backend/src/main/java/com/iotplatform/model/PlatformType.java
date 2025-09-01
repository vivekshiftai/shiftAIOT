package com.iotplatform.model;

/**
 * Enum for supported platform types in conversation configurations
 */
public enum PlatformType {
    SLACK("slack", "Slack"),
    GMAIL("gmail", "Gmail"),
    TEAMS("teams", "Microsoft Teams"),
    GOOGLE_CHAT("google_chat", "Google Chat"),
    SMS("sms", "SMS");

    private final String value;
    private final String displayName;

    PlatformType(String value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }

    public String getValue() {
        return value;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static PlatformType fromString(String text) {
        for (PlatformType type : PlatformType.values()) {
            if (type.value.equalsIgnoreCase(text)) {
                return type;
            }
        }
        throw new IllegalArgumentException("No platform type found with value: " + text);
    }

    public static boolean isValid(String text) {
        try {
            fromString(text);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
