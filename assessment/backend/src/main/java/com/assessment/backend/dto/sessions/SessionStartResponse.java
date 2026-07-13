package com.assessment.backend.dto.sessions;

import com.assessment.backend.dto.questions.QuestionDto;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Response for starting or resuming an attempt. Time is server-authoritative:
 * {@code remainingSeconds} is computed from the session's start time, so closing
 * the window does not stop the clock.
 */
@Data
@AllArgsConstructor
public class SessionStartResponse {
    private UUID sessionId;
    private Integer attemptNumber;
    private int timeLimitSeconds;
    private long remainingSeconds;
    private boolean resumed;   // true when returning to an existing in-progress attempt
    private boolean expired;   // true when the attempt's time ran out and it was auto-submitted
    private List<QuestionDto> questions;
    private List<SavedResponseDto> savedResponses;

    /** The attempt's time already elapsed while away → it has been finalized. */
    public static SessionStartResponse expired(UUID sessionId) {
        return new SessionStartResponse(sessionId, null, 0, 0, false, true, List.of(), List.of());
    }
}
