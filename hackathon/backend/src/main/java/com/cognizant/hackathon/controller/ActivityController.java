package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.ActivityPageResponse;
import com.cognizant.hackathon.service.ActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/activities")
@Tag(name = "Activity", description = "Dashboard activity feed")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @Operation(summary = "List activity-feed entries (paginated, newest first)")
    @GetMapping
    public ActivityPageResponse getActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return activityService.getActivities(page, size);
    }

    @Operation(summary = "Clear all activity logs (admin only)")
    @DeleteMapping
    public ResponseEntity<Void> clearActivities() {
        activityService.clearAll();
        return ResponseEntity.noContent().build();
    }
}
