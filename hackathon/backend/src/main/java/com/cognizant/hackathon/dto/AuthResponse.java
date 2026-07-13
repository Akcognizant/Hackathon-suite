package com.cognizant.hackathon.dto;

public record AuthResponse(
        String token,
        String email,
        String role
) {
}
