package com.cognizant.hackathon.entity.enums;

/**
 * Kind of message in the unified messaging table:
 *   DIRECT       — one-to-one to a specific receiver (receiverId set).
 *   ANNOUNCEMENT — broadcast to all participants (receiverId null); visible to everyone.
 */
public enum MessageType {
    DIRECT,
    ANNOUNCEMENT
}
