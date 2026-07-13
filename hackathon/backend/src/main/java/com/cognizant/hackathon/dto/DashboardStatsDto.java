package com.cognizant.hackathon.dto;

/** Aggregated submission statistics for the admin dashboard. */
public record DashboardStatsDto(
        long totalSubmissions,
        long pendingCount,
        long scoredCount
) {
}
