package com.cognizant.hackathon.entity;

import com.cognizant.hackathon.entity.enums.AdminRole;
import com.cognizant.hackathon.entity.enums.RequestStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * A pending/decided request from someone who wants an ADMIN or JUDGE account.
 * The chosen password is BCrypt-hashed at request time and stored here (never
 * serialized), so approval simply creates the {@link AdminUser} and the person can
 * log in immediately with the password they picked.
 */
@Entity
@Table(name = "access_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(nullable = false)
    private String email;

    /** BCrypt-hashed chosen password — never exposed in API responses. */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String passwordHash;

    /** Requested role — only ADMIN or JUDGE are accepted. */
    @Enumerated(EnumType.STRING)
    private AdminRole requestedRole;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    @Column(length = 500)
    private String reason;

    @CreationTimestamp
    private LocalDateTime createdAt;

    /** Email of the admin who approved/rejected (audit). */
    private String reviewedBy;

    private LocalDateTime reviewedAt;
}
