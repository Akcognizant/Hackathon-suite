package com.cognizant.hackathon.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Hackathon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be 200 characters or fewer")
    private String title;

    @Size(max = 1000, message = "Description must be 1000 characters or fewer")
    @Column(length = 1000)
    private String description;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotBlank(message = "Status is required")
    private String status;

    /**
     * Per-hackathon secret for the public submission endpoint (multi-tenant).
     * WRITE_ONLY: admins may set it via create/update payloads, but it is never
     * serialized back in API responses, so it can't leak through GET /admin/events.
     */
    @Column(length = 100)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String submissionSecret;

    /** Minimum members a participant team may have (null = no minimum). */
    private Integer minTeamSize;

    /** Maximum members a participant team may have (null = no maximum). */
    private Integer maxTeamSize;
}
