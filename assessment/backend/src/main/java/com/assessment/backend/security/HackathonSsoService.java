package com.assessment.backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Mints a hackathon-portal-compatible JWT for a passed candidate, signed with the
 * SHARED hackathon secret. The token mirrors what the hackathon issues at its own
 * login (subject = email) and adds {@code role=PARTICIPANT} + {@code name} claims so
 * the hackathon can auto-provision the participant on first arrival — no second login.
 */
@Service
public class HackathonSsoService {

    private final SecretKey key;
    private final long expirationMs;

    public HackathonSsoService(
            @Value("${hackathon.jwt.secret}") String secret,
            @Value("${hackathon.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String mintToken(String email, String name) {
        Date now = new Date();
        return Jwts.builder()
                .subject(email)
                .claim("role", "PARTICIPANT")
                .claim("name", name)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }
}
