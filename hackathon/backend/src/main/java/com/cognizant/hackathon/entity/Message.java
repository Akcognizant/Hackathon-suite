package com.cognizant.hackathon.entity;

import com.cognizant.hackathon.entity.enums.MessageType;
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

/**
 * A direct message between two portal users (Admins/Judges). Sender and receiver
 * are stored as AdminUser ids (a flat log, like TeamMessage) — no thread entity.
 * Auto-created by Hibernate (ddl-auto=update).
 */
@Entity
@Table(name = "direct_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long senderId;

    /** Target user for a DIRECT message; null for an ANNOUNCEMENT (broadcast). */
    private Long receiverId;

    /** DIRECT (one-to-one) or ANNOUNCEMENT (broadcast to all participants). */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MessageType messageType = MessageType.DIRECT;

    @Column(length = 2000)
    private String content;

    private Instant createdAt;

    /** Whether the receiver has read it. Column named is_read to avoid the SQL keyword. */
    @Column(name = "is_read")
    @Builder.Default
    private boolean read = false;
}
