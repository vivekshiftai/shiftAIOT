package com.iotplatform.dto;

/**
 * Builder class for AsyncResponse
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
public class AsyncResponseBuilder<T> {
    private String taskId;
    private String status;
    private T result;
    private String error;
    private String createdAt;
    private String completedAt;

    public AsyncResponseBuilder<T> taskId(String taskId) {
        this.taskId = taskId;
        return this;
    }

    public AsyncResponseBuilder<T> status(String status) {
        this.status = status;
        return this;
    }

    public AsyncResponseBuilder<T> result(T result) {
        this.result = result;
        return this;
    }

    public AsyncResponseBuilder<T> error(String error) {
        this.error = error;
        return this;
    }

    public AsyncResponseBuilder<T> createdAt(String createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public AsyncResponseBuilder<T> completedAt(String completedAt) {
        this.completedAt = completedAt;
        return this;
    }

    public AsyncResponse<T> build() {
        AsyncResponse<T> response = new AsyncResponse<>();
        response.setTaskId(taskId);
        response.setStatus(status);
        response.setResult(result);
        response.setError(error);
        response.setCreatedAt(createdAt);
        response.setCompletedAt(completedAt);
        return response;
    }
}
