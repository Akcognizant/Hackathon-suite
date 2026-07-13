package com.cognizant.hackathon.security;

import com.cognizant.hackathon.entity.AdminUser;
import com.cognizant.hackathon.entity.enums.AdminRole;
import com.cognizant.hackathon.repository.AdminUserRepository;
import com.cognizant.hackathon.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Reads a Bearer token from the Authorization header and, if valid, populates
 * the SecurityContext. Missing/invalid tokens are simply ignored here — the
 * authorization rules in SecurityConfig decide whether the request is allowed.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final AdminUserRepository adminUserRepository;

    // Local encoder for the random unused password of SSO-provisioned participants.
    // Deliberately NOT the PasswordEncoder bean — that lives in SecurityConfig, which
    // depends on this filter, so injecting it would create a bean cycle.
    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        try {
            // extractUsername parses+verifies the signature, so by this point the
            // token is known to be signed with our (shared) secret.
            final String email = jwtService.extractUsername(jwt);
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = loadOrProvision(email, jwt);
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ex) {
            // Malformed/expired token — leave the context unauthenticated.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Resolve the account for a verified token. Normal case: the email already
     * exists in {@code admins}. SSO case: a validly-signed token carrying
     * {@code role=PARTICIPANT} for an unknown email means a candidate who just
     * passed the assessment portal — auto-provision a PARTICIPANT account (with an
     * unusable random password, since they never log in here directly) so their
     * participant API calls resolve to a real account.
     */
    private UserDetails loadOrProvision(String email, String jwt) {
        try {
            return userDetailsService.loadUserByUsername(email);
        } catch (UsernameNotFoundException notFound) {
            String role = jwtService.extractClaim(jwt, c -> c.get("role", String.class));
            if (!"PARTICIPANT".equals(role)) {
                throw notFound;
            }
            String name = jwtService.extractClaim(jwt, c -> c.get("name", String.class));
            provisionParticipant(email, name);
            return userDetailsService.loadUserByUsername(email);
        }
    }

    /** Idempotently create a PARTICIPANT account for an SSO'd candidate. */
    private void provisionParticipant(String email, String name) {
        if (adminUserRepository.findByEmail(email).isPresent()) {
            return;
        }
        try {
            adminUserRepository.save(AdminUser.builder()
                    .email(email)
                    .name(name)
                    // Random, unknown password — SSO'd participants never sign in here.
                    .password(PASSWORD_ENCODER.encode(UUID.randomUUID().toString()))
                    .role(AdminRole.PARTICIPANT)
                    .build());
        } catch (RuntimeException raced) {
            // Concurrent first-request race: another thread created it — fine.
            if (adminUserRepository.findByEmail(email).isEmpty()) {
                throw raced;
            }
        }
    }
}
