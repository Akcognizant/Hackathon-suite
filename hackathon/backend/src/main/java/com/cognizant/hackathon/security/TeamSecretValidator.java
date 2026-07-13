package com.cognizant.hackathon.security;

import com.cognizant.hackathon.exception.UnauthorizedException;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Constant-time guard for the public team-submission endpoint. The expected
 * secret is now supplied per request (the specific hackathon's submissionSecret)
 * rather than a single global value — i.e. multi-tenant scoped validation.
 */
@Component
public class TeamSecretValidator {

    /**
     * Throws {@link UnauthorizedException} (HTTP 401) unless {@code provided} matches
     * {@code expected}. A null expected (hackathon with no configured secret) always
     * fails — a hackathon must be explicitly configured to accept submissions.
     */
    public void validate(String provided, String expected) {
        if (provided == null || expected == null
                || !MessageDigest.isEqual(
                        provided.getBytes(StandardCharsets.UTF_8),
                        expected.getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("Invalid or missing X-Team-Secret header");
        }
    }
}
