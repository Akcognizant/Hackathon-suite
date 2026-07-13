package com.assessment.backend.controller;

import com.assessment.backend.dto.auth.*;
import com.assessment.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/login
    @PostMapping("/auth/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // POST /api/auth/register
    @PostMapping("/auth/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    // PUT /api/candidates/{id}
    @PutMapping("/candidates/{id}")
    public ResponseEntity<AuthResponse> updateProfile(
            @PathVariable UUID id,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(id, request));
    }

    // PUT /api/candidates/{id}/password
    @PutMapping("/candidates/{id}/password")
    public ResponseEntity<Map<String, String>> updatePassword(
            @PathVariable UUID id,
            @RequestBody UpdatePasswordRequest request) {
        authService.updatePassword(id, request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}