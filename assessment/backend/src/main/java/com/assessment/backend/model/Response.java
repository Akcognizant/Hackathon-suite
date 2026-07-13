package com.assessment.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "responses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Response {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AssessmentSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    // ── MCQ answer ──
    @Column(name = "selected_option_index")
    private Integer selectedOptionIndex;

    // ── Activity answer + behavioural telemetry ──
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object answer;                 // {kind:'mapping',placements} | {kind:'order',order}

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object events;                 // raw drag event log

    @Column(name = "drag_attempts")
    private Integer dragAttempts = 0;

    @Column(name = "incorrect_placements")
    private Integer incorrectPlacements = 0;

    // ── Scoring (1 point per item) ──
    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "correct_count")
    private Integer correctCount = 0;

    @Column(name = "total_count")
    private Integer totalCount = 0;

    @Column(name = "time_taken_seconds")
    private Integer timeTakenSeconds;

    @Column(name = "attempt_count")
    private Integer attemptCount;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @PrePersist
    protected void onCreate() {
        if (answeredAt == null) answeredAt = LocalDateTime.now();
    }
}
