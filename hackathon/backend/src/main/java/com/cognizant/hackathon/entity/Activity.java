package com.cognizant.hackathon.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * An audit-feed entry shown in the dashboard's "Recent Activity" timeline.
 * One row per noteworthy event (e.g. a score being assigned).
 */
@Entity
@Table(name = "activities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable line rendered in the feed. */
    @Column(nullable = false, length = 500)
    private String message;

    /** Coarse category (e.g. SCORE_ASSIGNED) — drives the feed dot colour. */
    @Column(nullable = false, length = 50)
    private String type;

    /** Optional link back to the submission this activity is about. */
    @ManyToOne
    @JoinColumn(name = "submission_id")
    private Submission submission;

    /** Set by Hibernate on insert — gives the feed real, sortable timestamps. */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
