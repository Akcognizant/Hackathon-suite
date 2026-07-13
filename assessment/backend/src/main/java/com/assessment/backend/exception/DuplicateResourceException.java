package com.assessment.backend.exception;

// Thrown when creating/updating would collide with an existing record
// (e.g. username or email already taken) → HTTP 409
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
