package com.cognizant.hackathon.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** An assigned score for a submission. One row per submission. */
@Entity
@Table(name = "scores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "submission_id", unique = true)
    private Submission submission;

    /** Total awarded points. ("value" is a reserved word, so map to a safe column.) */
    @Column(name = "score_value")
    private int value;

    /** Email/username of the admin or judge who assigned this score (audit trail). */
    private String gradedBy;
}
