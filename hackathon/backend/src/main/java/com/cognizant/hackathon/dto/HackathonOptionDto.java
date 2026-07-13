package com.cognizant.hackathon.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Minimal, public-safe hackathon option for the submission form's dropdown — no secrets. */
@Schema(description = "Selectable hackathon (id + title only).")
public record HackathonOptionDto(Long id, String title) {
}
