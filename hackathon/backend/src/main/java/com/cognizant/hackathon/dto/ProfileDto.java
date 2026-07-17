package com.cognizant.hackathon.dto;

/** The signed-in user's account details, shown on the Profile Settings screen. */
public record ProfileDto(
        String email,
        String name,
        String role
) {
}
