package com.iotplatform.dto;

public class DeviceStatsResponse {
    private long total;
    private long online;
    private long offline;
    private long warning;
    private long error;

    public DeviceStatsResponse(long total, long online, long offline, long warning, long error) {
        this.total = total;
        this.online = online;
        this.offline = offline;
        this.warning = warning;
        this.error = error;
    }

    // Getters and Setters
    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public long getOnline() { return online; }
    public void setOnline(long online) { this.online = online; }

    public long getOffline() { return offline; }
    public void setOffline(long offline) { this.offline = offline; }

    public long getWarning() { return warning; }
    public void setWarning(long warning) { this.warning = warning; }

    public long getError() { return error; }
    public void setError(long error) { this.error = error; }
}