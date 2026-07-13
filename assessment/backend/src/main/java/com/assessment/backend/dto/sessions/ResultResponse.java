// ResultResponse.java
package com.assessment.backend.dto.sessions;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ResultResponse {

    private UUID sessionId;
    private String candidateName;
    private Integer attemptNumber;
    private Integer totalQuestions;   // number of items (MCQ + activities) in the attempt
    private Integer correct;          // correct items (Σ correctCount)
    private Integer incorrect;        // attempted-but-wrong items
    private Integer skipped;          // unattempted items
    private Double accuracy;          // 0..100
    private Integer finalScore;       // == correct (1 pt/item)
    private Integer maxScore;         // == Σ totalCount
    private Integer totalTimeSeconds;
    private List<QuestionResult> responses;

    @Data
    @AllArgsConstructor
    public static class QuestionResult {
        private UUID questionId;
        private String section;        // "pattern" | "drag"
        private String questionType;
        private String questionText;

        // per-item scoring (both types)
        private Integer correctCount;
        private Integer totalCount;

        // MCQ specifics (null for activities)
        private Integer selectedOptionIndex;
        private Integer correctOptionIndex;
        private String selectedOption;
        private String correctOption;

        // activity specifics (null for MCQ)
        private Integer incorrectPlacements;
        private Integer dragAttempts;

        // common
        private Boolean isCorrect;     // all items correct
        private Boolean isSkipped;     // nothing submitted
        private Integer timeTakenSeconds;
        private Integer attemptCount;
    }
}
