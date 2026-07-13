package com.cognizant.hackathon.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleResourceNotFound(ResourceNotFoundException ex) {
        return build(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage());
    }

    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<Object> handleBadCredentials(RuntimeException ex) {
        return build(HttpStatus.UNAUTHORIZED, "Unauthorized", ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Object> handleUnauthorized(UnauthorizedException ex) {
        return build(HttpStatus.UNAUTHORIZED, "Unauthorized", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgument(IllegalArgumentException ex) {
        return build(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        ResponseEntity<Object> response = build(HttpStatus.BAD_REQUEST, "Validation Failed", "Request validation failed");
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        if (body != null) {
            body.put("fieldErrors", fieldErrors);
        }
        return response;
    }

    @ExceptionHandler(RepositoryNotAccessibleException.class)
    public ResponseEntity<Object> handleRepoNotAccessible(RepositoryNotAccessibleException ex) {
        // Distinct 422 so the UI can show a specific "repo private/404" message.
        return build(HttpStatus.UNPROCESSABLE_ENTITY, "Repository Not Accessible", ex.getMessage());
    }

    @ExceptionHandler(AiUnavailableException.class)
    public ResponseEntity<Object> handleAiUnavailable(AiUnavailableException ex) {
        // Upstream (Node AI proxy) is down/errored — that's a gateway failure, not our bug.
        return build(HttpStatus.BAD_GATEWAY, "Bad Gateway", ex.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Object> handleNoResource(NoResourceFoundException ex) {
        // An unmatched route is a 404, not a 500 — don't let the catch-all below
        // mislabel "no handler for this path" as an internal server error.
        return build(HttpStatus.NOT_FOUND, "Not Found", "No endpoint for: " + ex.getResourcePath());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneric(Exception ex) {
        // Log the full stack trace — otherwise an unexpected 500 is invisible in the console.
        log.error("Unhandled exception resulting in HTTP 500", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", ex.getMessage());
    }

    private ResponseEntity<Object> build(HttpStatus status, String error, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        return new ResponseEntity<>(body, status);
    }
}
