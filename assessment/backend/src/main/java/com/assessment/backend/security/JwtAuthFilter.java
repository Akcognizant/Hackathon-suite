package com.assessment.backend.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Validates the "Authorization: Bearer &lt;jwt&gt;" header on every non-public request.
 * On success it stashes the candidate id/username as request attributes; on failure it
 * short-circuits with a 401 JSON body matching the {"message": "..."} shape the frontend expects.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    // Endpoints that must stay open (no token required).
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/register"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // CORS preflight requests and the public auth endpoints never carry a token.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        return PUBLIC_PATHS.contains(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            unauthorized(request, response, "Missing or invalid Authorization header");
            return;
        }

        try {
            Claims claims = jwtService.parse(header.substring(7));
            request.setAttribute("candidateId", claims.getSubject());
            request.setAttribute("username", claims.get("username"));
        } catch (Exception e) {
            unauthorized(request, response, "Invalid or expired token");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void unauthorized(HttpServletRequest request, HttpServletResponse response, String message)
            throws IOException {
        // Reflect CORS headers so the browser surfaces the 401 instead of masking it as a CORS error.
        String origin = request.getHeader("Origin");
        if (origin != null) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
