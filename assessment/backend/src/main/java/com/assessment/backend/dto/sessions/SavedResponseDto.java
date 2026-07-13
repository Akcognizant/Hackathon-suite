package com.assessment.backend.dto.sessions;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.UUID;

/** A previously-saved answer for a question, returned when resuming a session. */
@Data
@AllArgsConstructor
public class SavedResponseDto {
    private UUID questionId;
    private Integer selectedOptionIndex; // MCQ; null if not answered
    private Object answer;               // activity answer (mapping/order); null for MCQ
    private Integer dragAttempts;
    private Integer timeTakenSeconds;
    private Integer attemptCount;
}
