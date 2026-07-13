package com.cognizant.hackathon.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Persisted, pre-computed leaderboard rankings per event. Rebuilt whenever a
 * score is assigned. ("rank" is a reserved word in PostgreSQL, so the column is
 * mapped to "ranking".)
 */
@Entity
@Table(name = "leaderboard")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Leaderboard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long eventId;

    private String teamName;

    private String projectTitle;

    private int score;

    @Column(name = "ranking")
    private int ranking;
}
