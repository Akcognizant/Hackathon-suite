package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.AccessRequestDto;
import com.cognizant.hackathon.entity.enums.RequestStatus;
import com.cognizant.hackathon.service.AccessRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Admin-only review of access requests. Falls under the {@code /admin/**} →
 * hasRole("ADMIN") rule in SecurityConfig, so judges cannot reach it.
 */
@RestController
@RequestMapping("/admin/access-requests")
@RequiredArgsConstructor
public class AdminAccessRequestController {

    private final AccessRequestService service;

    @GetMapping
    public List<AccessRequestDto> list(@RequestParam(required = false) RequestStatus status) {
        return service.list(status);
    }

    @GetMapping("/count")
    public Map<String, Long> pendingCount() {
        return Map.of("pending", service.pendingCount());
    }

    @PostMapping("/{id}/approve")
    public void approve(@PathVariable Long id, Authentication auth) {
        service.approve(id, auth != null ? auth.getName() : null);
    }

    @PostMapping("/{id}/reject")
    public void reject(@PathVariable Long id, Authentication auth) {
        service.reject(id, auth != null ? auth.getName() : null);
    }
}
