package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.ChangePasswordRequest;
import com.cognizant.hackathon.dto.ProfileDto;
import com.cognizant.hackathon.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Self-service account endpoints for the signed-in user (any authenticated role).
 * Not under /api/auth (which is public) — these require a valid JWT via the
 * catch-all authenticated() rule in SecurityConfig.
 */
@RestController
@RequestMapping("/api/account")
@Tag(name = "Account", description = "Signed-in user's own profile")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @Operation(summary = "Get the signed-in user's profile")
    @GetMapping("/me")
    public ProfileDto me() {
        return accountService.getProfile();
    }

    @Operation(summary = "Change the signed-in user's password")
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        accountService.changePassword(request);
        return ResponseEntity.noContent().build();
    }
}
