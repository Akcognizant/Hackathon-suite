// ResponseDto.java  (one question's response in the submit payload)
package com.assessment.backend.dto.sessions;

import lombok.Data;
import java.util.UUID;

@Data
public class ResponseDto {
    private UUID questionId;
    private Integer selectedOptionIndex;  // MCQ; null if skipped
    private Object answer;                // activity answer (mapping/order)
    private Object events;                // activity drag-event log
    private Integer dragAttempts;
    private Integer timeTakenSeconds;
    private Integer attemptCount;
}
