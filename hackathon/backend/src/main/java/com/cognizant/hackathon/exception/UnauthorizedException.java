package com.cognizant.hackathon.exception;

/** Thrown when a request fails a credential check (e.g. a bad X-Team-Secret). Maps to HTTP 401. */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
