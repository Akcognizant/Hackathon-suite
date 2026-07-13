package com.assessment.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A question covers two sections (polymorphic by {@code questionType}):
 *   section "pattern" → MCQ  (number_sequence | shape_pattern | matrix): uses patternData, options, correctOptionIndex
 *   section "drag"    → activity (categorize | match | sequence | rank | fill-blank): uses prompt, items, zones, answerKey, suffix
 * answerKey is server-only and is never serialised to the client.
 */
@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String section;               // "pattern" | "drag"

    @Column(name = "question_text", nullable = false)
    private String questionText;          // MCQ text, or activity title

    @Column(name = "question_type", nullable = false)
    private String questionType;

    @Column
    private String prompt;                // activity instruction (null for MCQ)

    // ── MCQ fields (null for activities) ──
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pattern_data", columnDefinition = "jsonb")
    private Object patternData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object options;

    @Column(name = "correct_option_index")
    private Integer correctOptionIndex;

    // ── Activity fields (null for MCQ) ──
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object items;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object zones;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answer_key", columnDefinition = "jsonb")
    private Object answerKey;             // server-only

    @Column
    private String suffix;                // fill-blank only

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
