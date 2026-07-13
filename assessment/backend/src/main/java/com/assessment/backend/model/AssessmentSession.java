package com.assessment.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "assessment_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "total_time_seconds")
    private Integer totalTimeSeconds;

    @Column(name = "final_score")
    private Integer finalScore;

    @Column(name = "max_score")
    private Integer maxScore;

    @Column(name = "accuracy_percentage")
    private Double accuracyPercentage;

    @Column(nullable = false)
    private String status;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) startedAt = LocalDateTime.now();
        if (status == null) status = "IN_PROGRESS";
    }
}