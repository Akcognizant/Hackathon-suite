package com.cognizant.hackathon.entity;

import com.cognizant.hackathon.entity.enums.AdminRole;
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

import java.time.Instant;

@Entity
@Table(name = "admins")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    /** Display name. Nullable so pre-existing admin rows (seeded without a name) still load. */
    private String name;

    /** BCrypt-hashed password. */
    private String password;

    @Enumerated(EnumType.STRING)
    private AdminRole role;

    /**
     * When this user last cleared their inbox. Direct messages are deleted on clear,
     * but announcements are shared/global — so we hide announcements created on or
     * before this timestamp for THIS user only (per-user clear, non-destructive).
     */
    private Instant inboxClearedAt;
}
