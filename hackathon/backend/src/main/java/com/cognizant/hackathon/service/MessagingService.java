package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.MessageDto;
import com.cognizant.hackathon.dto.SendDirectMessageRequest;
import com.cognizant.hackathon.dto.UserOptionDto;
import com.cognizant.hackathon.entity.AdminUser;
import com.cognizant.hackathon.entity.Message;
import com.cognizant.hackathon.entity.enums.MessageType;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.AdminUserRepository;
import com.cognizant.hackathon.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Direct user-to-user messaging (Admins ↔ Judges). Sender is always the
 * authenticated principal; recipients are other portal users. Distinct from the
 * team-facing TeamMessage feature.
 */
@Service
@RequiredArgsConstructor
public class MessagingService {

    private final MessageRepository messageRepository;
    private final AdminUserRepository adminUserRepository;

    @Transactional
    public MessageDto send(SendDirectMessageRequest request) {
        AdminUser sender = currentUser();
        AdminUser receiver = adminUserRepository.findById(request.receiverId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Recipient not found with id: " + request.receiverId()));

        Message saved = messageRepository.save(Message.builder()
                .senderId(sender.getId())
                .receiverId(receiver.getId())
                .messageType(MessageType.DIRECT)
                .content(request.content().trim())
                .createdAt(Instant.now())
                .read(false)
                .build());

        Map<Long, String> emails = Map.of(
                sender.getId(), sender.getEmail(),
                receiver.getId(), receiver.getEmail());
        return toDto(saved, emails);
    }

    /**
     * Broadcasts an announcement to all participants. Stored ONCE (receiverId null,
     * type ANNOUNCEMENT) in the same table as direct messages — one unified system.
     */
    @Transactional
    public MessageDto broadcastAnnouncement(String content) {
        AdminUser sender = currentUser();
        Message saved = messageRepository.save(Message.builder()
                .senderId(sender.getId())
                .receiverId(null)
                .messageType(MessageType.ANNOUNCEMENT)
                .content(content.trim())
                .createdAt(Instant.now())
                .read(false)
                .build());
        return toDto(saved, Map.of(sender.getId(), sender.getEmail()));
    }

    /**
     * The current user's unified inbox: direct messages to them PLUS all broadcast
     * announcements, newest first.
     */
    @Transactional(readOnly = true)
    public List<MessageDto> inbox() {
        AdminUser me = currentUser();
        Map<Long, String> emails = emailMap();
        Instant clearedAt = me.getInboxClearedAt();
        return messageRepository
                .findByReceiverIdOrMessageTypeOrderByCreatedAtDesc(me.getId(), MessageType.ANNOUNCEMENT)
                .stream()
                // Hide announcements the user already cleared (shared rows can't be deleted
                // per-user, so we filter them out by the clear timestamp). Direct messages
                // are actually deleted on clear, so anything here is post-clear.
                .filter(message -> !isClearedAnnouncement(message, clearedAt))
                .map(message -> toDto(message, emails))
                .toList();
    }

    /** True for an announcement created on/before the user's last inbox clear. */
    private boolean isClearedAnnouncement(Message message, Instant clearedAt) {
        return clearedAt != null
                && message.getMessageType() == MessageType.ANNOUNCEMENT
                && message.getCreatedAt() != null
                && !message.getCreatedAt().isAfter(clearedAt);
    }

    /** Announcements only — for a participant-facing notifications view. */
    @Transactional(readOnly = true)
    public List<MessageDto> announcements() {
        Map<Long, String> emails = emailMap();
        return messageRepository.findByMessageTypeOrderByCreatedAtDesc(MessageType.ANNOUNCEMENT).stream()
                .map(message -> toDto(message, emails))
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return messageRepository.countByReceiverIdAndReadFalse(currentUser().getId());
    }

    /**
     * Clears the current user's inbox by deleting the direct messages addressed to
     * them. Broadcast announcements are shared, global notices (one row for everyone),
     * so they are intentionally left in place — clearing must not remove them for
     * other users.
     */
    @Transactional
    public void clearInbox() {
        AdminUser me = currentUser();
        // Direct messages are the user's own — delete them outright.
        messageRepository.deleteByReceiverId(me.getId());
        // Announcements are shared/global; record the clear time so they're hidden
        // from THIS user's inbox from now on (without affecting anyone else).
        me.setInboxClearedAt(Instant.now());
        adminUserRepository.save(me);
    }

    /** Marks a message read — only the receiver may do so (else it's "not found"). */
    @Transactional
    public void markRead(Long id) {
        AdminUser me = currentUser();
        Message message = messageRepository.findById(id)
                .filter(m -> m.getReceiverId().equals(me.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));
        if (!message.isRead()) {
            message.setRead(true);
            messageRepository.save(message);
        }
    }

    /** Other portal users the current user can message (everyone except themselves). */
    @Transactional(readOnly = true)
    public List<UserOptionDto> recipients() {
        Long meId = currentUser().getId();
        return adminUserRepository.findAll().stream()
                .filter(user -> !user.getId().equals(meId))
                .map(user -> new UserOptionDto(
                        user.getId(),
                        user.getEmail(),
                        user.getRole() != null ? user.getRole().name() : null))
                .toList();
    }

    private Map<Long, String> emailMap() {
        Map<Long, String> map = new HashMap<>();
        adminUserRepository.findAll().forEach(user -> map.put(user.getId(), user.getEmail()));
        return map;
    }

    private MessageDto toDto(Message m, Map<Long, String> emails) {
        return new MessageDto(
                m.getId(),
                m.getSenderId(),
                emails.get(m.getSenderId()),
                m.getReceiverId(),
                m.getReceiverId() != null ? emails.get(m.getReceiverId()) : null,
                m.getMessageType() != null ? m.getMessageType().name() : null,
                m.getContent(),
                m.getCreatedAt(),
                m.isRead());
    }

    private AdminUser currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (auth != null) ? auth.getName() : null;
        return adminUserRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + email));
    }
}
