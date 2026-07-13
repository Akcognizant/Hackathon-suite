package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.AuthResponse;
import com.cognizant.hackathon.dto.LoginRequest;
import com.cognizant.hackathon.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // NOTE: Direct participant self-registration was removed. Participants may only
    // reach the hackathon by passing the assessment portal, which hands them off via
    // a shared-secret SSO token (auto-provisioned in JwtAuthenticationFilter).
    // Admin/judge accounts remain seeded server-side.

    /**
     * Stateless logout: with JWTs there is no server session to invalidate, so
     * the client simply discards its token. Exposed for API symmetry.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
