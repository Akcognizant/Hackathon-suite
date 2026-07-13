package com.cognizant.hackathon.exception;

/**
 * Raised when the AI grading assistant cannot access a submission's repository
 * (private, 404, or otherwise unreachable). Maps to HTTP 422 so the UI can show a
 * specific "Repository Not Accessible" message, distinct from a bad-URL (400) or an
 * AI/service failure (502).
 */
public class RepositoryNotAccessibleException extends RuntimeException {
    public RepositoryNotAccessibleException(String message) {
        super(message);
    }
}
