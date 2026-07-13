package com.cognizant.hackathon.dto;

import com.cognizant.hackathon.entity.Activity;

import java.time.LocalDateTime;

/** Activity feed item as consumed by the dashboard UI. */
public record ActivityDto(
        Long id,
        String message,
        String type,
        LocalDateTime createdAt
) {
    public static ActivityDto from(Activity activity) {
        return new ActivityDto(
                activity.getId(),
                activity.getMessage(),
                activity.getType(),
                activity.getCreatedAt());
    }
}
