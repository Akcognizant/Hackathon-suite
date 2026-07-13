package com.assessment.backend.exception;

// Thrown when a requested record (e.g. a candidate) does not exist → HTTP 404
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
