package com.assessment.backend.controller;

import com.assessment.backend.dto.sessions.*;
import com.assessment.backend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    // POST /api/sessions/start — starts a new attempt or resumes the in-progress one
    @PostMapping("/start")
    public ResponseEntity<?> startSession(@RequestBody StartSessionRequest request) {
        try {
            SessionStartResponse response = sessionService.startOrResume(request.getCandidateId());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    // PATCH /api/sessions/{sessionId}/responses — autosave a single answer
    @PatchMapping("/{sessionId}/responses")
    public ResponseEntity<?> autosave(@PathVariable UUID sessionId, @RequestBody AutosaveRequest request) {
        try {
            sessionService.saveResponse(sessionId, request);
            return ResponseEntity.ok(Map.of("status", "saved"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    // POST /api/sessions/{sessionId}/submit
    @PostMapping("/{sessionId}/submit")
    public ResponseEntity<?> submitSession(
            @PathVariable UUID sessionId,
            @RequestBody SubmitRequest request) {
        try {
            ResultResponse response = sessionService.submitSession(sessionId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    // GET /api/sessions/{sessionId}/result
    @GetMapping("/{sessionId}/result")
    public ResponseEntity<?> getResult(@PathVariable UUID sessionId) {
        try {
            ResultResponse response = sessionService.getResult(sessionId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    // GET /api/sessions/{sessionId}/analytics
    @GetMapping("/{sessionId}/analytics")
    public ResponseEntity<?> getAnalytics(@PathVariable UUID sessionId) {
        try {
            AnalyticsResponse response = sessionService.getAnalytics(sessionId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    // GET /api/sessions?candidateId=xxx  (dashboard history)
    @GetMapping
    public ResponseEntity<?> getHistory(@RequestParam UUID candidateId) {
        try {
            List<Map<String, Object>> history = sessionService.getHistory(candidateId);
            return ResponseEntity.ok(history);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }
}