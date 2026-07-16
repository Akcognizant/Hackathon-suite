package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.MessageDto;
import com.cognizant.hackathon.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Participant-facing notifications: the messages an admin has sent them — direct
 * messages addressed to the participant plus broadcast announcements. Reuses the
 * shared {@link MessagingService}, which resolves the current user from the JWT
 * (participants are AdminUser rows with role PARTICIPANT). Gated to PARTICIPANT
 * via SecurityConfig's {@code /participant/**} rule.
 */
@RestController
@RequestMapping("/participant/messages")
@RequiredArgsConstructor
public class ParticipantMessagingController {

    private final MessagingService messagingService;

    /** Direct messages to me + all announcements, newest first. */
    @GetMapping
    public List<MessageDto> inbox() {
        return messagingService.inbox();
    }

    /** Unread count for the notification badge. */
    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", messagingService.unreadCount());
    }

    /** Mark a direct message as read (announcements have no per-user read state). */
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        messagingService.markRead(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Clear the participant's inbox: deletes the direct messages addressed to them.
     * Broadcast announcements are shared (one row for everyone) and intentionally
     * left in place — the client dismisses those locally.
     */
    @DeleteMapping
    public ResponseEntity<Void> clear() {
        messagingService.clearInbox();
        return ResponseEntity.noContent().build();
    }
}
