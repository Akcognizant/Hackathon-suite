package com.cognizant.hackathon.exception;

/** Thrown when the upstream AI (Node) proxy is unreachable or errors. Maps to HTTP 502. */
public class AiUnavailableException extends RuntimeException {
    public AiUnavailableException(String message) {
        super(message);
    }
}
