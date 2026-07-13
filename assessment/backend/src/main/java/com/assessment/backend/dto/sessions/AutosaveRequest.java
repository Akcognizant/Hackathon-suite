package com.assessment.backend.dto.sessions;

import lombok.Data;
import java.util.UUID;

/** Autosave payload for a single question/activity during an in-progress attempt. */
@Data
public class AutosaveRequest {
    private UUID questionId;
    private Integer selectedOptionIndex; // MCQ; null clears
    private Object answer;               // activity answer (mapping/order)
    private Object events;               // activity drag-event log (scored server-side)
    private Integer dragAttempts;
    private Integer timeTakenSeconds;
    private Integer attemptCount;
}
