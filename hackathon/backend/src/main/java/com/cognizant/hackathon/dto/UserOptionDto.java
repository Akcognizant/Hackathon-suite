package com.cognizant.hackathon.dto;

/** A selectable message recipient (portal user). */
public record UserOptionDto(
        Long id,
        String email,
        String role
) {
}
