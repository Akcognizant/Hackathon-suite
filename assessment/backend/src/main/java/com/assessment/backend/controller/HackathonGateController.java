package com.assessment.backend.controller;

import com.assessment.backend.model.Candidate;
import com.assessment.backend.repository.CandidateRepository;
import com.assessment.backend.security.HackathonSsoService;
import com.assessment.backend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Hackathon gate: exposes the candidate's pass/attempt status and, once passed,
 * mints a hackathon SSO token so they can cross over without re-authenticating.
 *
 * Both endpoints derive the candidate id from the authenticated JWT (set as a
 * request attribute by {@code JwtAuthFilter}) — never from the client.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HackathonGateController {

    private final SessionService sessionService;
    private final CandidateRepository candidateRepository;
    private final HackathonSsoService ssoService;

    @Value("${hackathon.url}")
    private String hackathonUrl;

    /** Gate status for the current candidate (passed / blocked / attempts / best accuracy). */
    @GetMapping("/gate/status")
    public ResponseEntity<?> status(@RequestAttribute("candidateId") String candidateId) {
        return ResponseEntity.ok(sessionService.getGateStatus(UUID.fromString(candidateId)));
    }

    /**
     * Mint a hackathon SSO token for the current candidate — only if they've passed.
     * The frontend redirects to {@code <hackathonUrl>/sso#token=<token>}.
     */
    @PostMapping("/sso/hackathon")
    public ResponseEntity<?> ssoToHackathon(@RequestAttribute("candidateId") String candidateId) {
        UUID id = UUID.fromString(candidateId);
        if (!sessionService.hasPassed(id)) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "You must score at least 75% to access the hackathon."));
        }
        Candidate candidate = candidateRepository.findById(id).orElse(null);
        if (candidate == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Candidate not found"));
        }
        String token = ssoService.mintToken(candidate.getEmail(), candidate.getName());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "hackathonUrl", hackathonUrl,
                "email", candidate.getEmail(),
                "name", candidate.getName()));
    }
}
