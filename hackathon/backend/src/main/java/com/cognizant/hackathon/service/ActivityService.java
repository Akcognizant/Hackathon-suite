package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.ActivityDto;
import com.cognizant.hackathon.dto.ActivityPageResponse;
import com.cognizant.hackathon.entity.Activity;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;

    /**
     * Records a single activity-feed entry. Runs in its own transaction
     * (REQUIRES_NEW) so it can be safely invoked from an AFTER_COMMIT listener —
     * the original business transaction is already closed by then.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Activity recordActivity(Submission submission, String message, String type) {
        return activityRepository.save(Activity.builder()
                .submission(submission)
                .message(message)
                .type(type)
                .build());
    }

    /** Records an activity not tied to a specific submission (e.g. hackathon/team events). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Activity recordActivity(String message, String type) {
        return activityRepository.save(Activity.builder()
                .message(message)
                .type(type)
                .build());
    }

    /** A single page of activity-feed entries, newest first. */
    @Transactional(readOnly = true)
    public ActivityPageResponse getActivities(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Activity> result = activityRepository.findAll(pageable);

        List<ActivityDto> items = result.getContent().stream()
                .map(ActivityDto::from)
                .toList();

        return new ActivityPageResponse(
                items,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.hasNext());
    }

    /** Permanently removes every activity entry (admin-only utility). */
    @Transactional
    public void clearAll() {
        activityRepository.deleteAllInBatch();
    }
}
