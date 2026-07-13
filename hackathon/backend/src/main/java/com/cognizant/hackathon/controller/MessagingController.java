package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.AnnouncementRequest;
import com.cognizant.hackathon.dto.MessageDto;
import com.cognizant.hackathon.dto.SendDirectMessageRequest;
import com.cognizant.hackathon.dto.UserOptionDto;
import com.cognizant.hackathon.service.MessagingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Direct messaging between portal users (Admins ↔ Judges). All endpoints require an
 * authenticated ADMIN or JUDGE (see SecurityConfig: /admin/messages/**).
 */
@RestController
@RequestMapping("/admin/messages")
@Tag(name = "Messaging", description = "Direct messages between admins and judges")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService messagingService;

    @Operation(summary = "Send a direct message to another user")
    @PostMapping
    public MessageDto send(@Valid @RequestBody SendDirectMessageRequest request) {
        return messagingService.send(request);
    }

    @Operation(summary = "Broadcast an announcement to all participants (admin only)")
    @PostMapping("/announcement")
    public MessageDto announce(@Valid @RequestBody AnnouncementRequest request) {
        return messagingService.broadcastAnnouncement(request.content());
    }

    @Operation(summary = "The current user's unified inbox: direct messages + announcements")
    @GetMapping("/inbox")
    public List<MessageDto> inbox() {
        return messagingService.inbox();
    }

    @Operation(summary = "Announcements only (for a participant-facing notifications view)")
    @GetMapping("/announcements")
    public List<MessageDto> announcements() {
        return messagingService.announcements();
    }

    @Operation(summary = "Unread message count for the notification badge")
    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", messagingService.unreadCount());
    }

    @Operation(summary = "Mark a message as read (receiver only)")
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        messagingService.markRead(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "List users this user can message (all others)")
    @GetMapping("/users")
    public List<UserOptionDto> recipients() {
        return messagingService.recipients();
    }
}
