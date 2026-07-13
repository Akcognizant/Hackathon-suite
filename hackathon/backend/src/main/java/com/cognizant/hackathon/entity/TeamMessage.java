package com.cognizant.hackathon.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A single internal admin-to-team message. Kept intentionally simple (a flat log
 * keyed by teamId) — this is a one-way notice board from admins to a team, not a
 * threaded conversation. The table is auto-created by Hibernate (ddl-auto=update).
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long teamId;

    /** Author (admin email from the JWT principal). */
    private String sender;

    @Column(length = 2000)
    private String body;

    private Instant createdAt;
}
