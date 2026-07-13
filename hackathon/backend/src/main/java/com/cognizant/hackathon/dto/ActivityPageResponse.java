package com.cognizant.hackathon.dto;

import java.util.List;

/**
 * One page of activity-feed items plus the cursor metadata the UI needs to
 * decide whether to show a "Load More" button.
 */
public record ActivityPageResponse(
        List<ActivityDto> items,
        int page,
        int size,
        long totalElements,
        boolean hasMore
) {
}
