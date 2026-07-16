package com.cognizant.hackathon.entity;

import com.cognizant.hackathon.entity.enums.ContributionType;
import com.cognizant.hackathon.entity.enums.ParticipantRole;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String email;

    @Enumerated(EnumType.STRING)
    private ParticipantRole role;

    // --- Individual talent evaluation (independent of the team's project score) ---

    /** Technical skill rating, 1-5. Null until the participant has been evaluated. */
    private Integer technicalScore;

    /** Primary contribution to the team (Lead / Developer / Design / Presentation). */
    @Enumerated(EnumType.STRING)
    private ContributionType contributionType;

    /**
     * Whether an individual evaluation has been submitted. Boolean (not primitive)
     * so pre-existing rows — which get NULL under ddl-auto=update — read as
     * "not evaluated" instead of throwing on a null primitive.
     */
    private Boolean evaluationStatus;

    /** True for the team's creator (the "Team Lead"). Boolean so pre-existing rows read as not-lead. */
    private Boolean teamLead;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;
}
