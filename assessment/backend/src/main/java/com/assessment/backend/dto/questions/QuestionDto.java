package com.assessment.backend.dto.questions;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.UUID;

/**
 * A question/activity as delivered to the client. Deliberately omits the answer:
 * MCQ {@code correctOptionIndex} and activity {@code answerKey} are server-only.
 */
@Data
@AllArgsConstructor
public class QuestionDto {
    private UUID id;
    private String section;        // "pattern" | "drag"
    private String questionType;
    private String questionText;   // MCQ text / activity title
    private String prompt;         // activity instruction (null for MCQ)

    // MCQ (null for activities)
    private Object patternData;
    private Object options;

    // Activity (null for MCQ)
    private Object items;
    private Object zones;
    private String suffix;
}
