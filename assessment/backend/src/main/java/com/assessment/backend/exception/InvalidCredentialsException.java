package com.assessment.backend.exception;

// Thrown when a password / credential check fails → HTTP 401
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
