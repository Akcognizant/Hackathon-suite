// AnalyticsResponse.java
package com.assessment.backend.dto.sessions;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class AnalyticsResponse {

    private UUID sessionId;
    private Integer totalTimeSeconds;
    private Integer correct;
    private Integer incorrect;
    private Integer skipped;
    private Double accuracy;                  // 0..100
    private Integer avgTimePerQuestion;
    private Integer totalAttempts;
    private Integer totalDragAttempts;
    private Integer totalIncorrectPlacements;
    private List<QuestionAnalytics> perQuestion;
    private List<SectionBreakdown> sectionBreakdown;

    @Data
    @AllArgsConstructor
    public static class QuestionAnalytics {
        private String label;                 // Q1, Q2, ...
        private String section;               // "pattern" | "drag"
        private String questionType;
        private String questionText;
        private Integer timeTaken;
        private Integer attempts;
        private Integer incorrectPlacements;  // activities only (0 for MCQ)
        private String status;                // correct / partial / incorrect / skipped
    }

    @Data
    @AllArgsConstructor
    public static class SectionBreakdown {
        private String section;               // "pattern" | "drag"
        private Integer total;                // items
        private Integer correct;
        private Integer accuracy;             // 0..100
    }
}
