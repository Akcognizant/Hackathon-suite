package com.cognizant.hackathon.dto;

/** Summary returned after a successful (fully committed) CSV import. */
public record ImportResult(
        int processed,
        int created,
        int updated
) {
}
