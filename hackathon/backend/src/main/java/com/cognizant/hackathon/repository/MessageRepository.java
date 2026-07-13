package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.Message;
import com.cognizant.hackathon.entity.enums.MessageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Unified inbox, newest first: direct messages addressed to this user PLUS every
     * broadcast announcement. One query keeps direct + announcement in a single feed.
     */
    List<Message> findByReceiverIdOrMessageTypeOrderByCreatedAtDesc(Long receiverId, MessageType messageType);

    /** Announcements only (e.g. a participant-facing notifications view), newest first. */
    List<Message> findByMessageTypeOrderByCreatedAtDesc(MessageType messageType);

    /** Unread count for the notification badge (direct messages only — see service note). */
    long countByReceiverIdAndReadFalse(Long receiverId);
}
