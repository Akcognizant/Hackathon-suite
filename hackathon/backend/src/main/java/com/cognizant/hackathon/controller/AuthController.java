package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.AccessRequestCreate;
import com.cognizant.hackathon.dto.AuthResponse;
import com.cognizant.hackathon.dto.LoginRequest;
import com.cognizant.hackathon.service.AccessRequestService;
import com.cognizant.hackathon.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AccessRequestService accessRequestService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /**
     * Public: request an ADMIN or JUDGE account. Creates a PENDING request for an
     * existing admin to approve — no account is created until approval.
     * (Participant self-registration remains removed; participants enter via the
     * assessment SSO handoff.)
     */
    @PostMapping("/access-request")
    @ResponseStatus(HttpStatus.CREATED)
    public void requestAccess(@Valid @RequestBody AccessRequestCreate request) {
        accessRequestService.submit(request);
    }

    /**
     * Stateless logout: with JWTs there is no server session to invalidate, so
     * the client simply discards its token. Exposed for API symmetry.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
