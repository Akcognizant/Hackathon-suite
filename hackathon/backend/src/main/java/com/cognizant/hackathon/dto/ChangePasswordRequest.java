package com.cognizant.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Body for POST /api/account/change-password. */
public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "New password must be at least 6 characters")
        String newPassword
) {
}
