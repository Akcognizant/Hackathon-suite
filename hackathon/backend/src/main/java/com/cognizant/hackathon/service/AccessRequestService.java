package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.AccessRequestCreate;
import com.cognizant.hackathon.dto.AccessRequestDto;
import com.cognizant.hackathon.entity.AccessRequest;
import com.cognizant.hackathon.entity.AdminUser;
import com.cognizant.hackathon.entity.enums.AdminRole;
import com.cognizant.hackathon.entity.enums.RequestStatus;
import com.cognizant.hackathon.repository.AccessRequestRepository;
import com.cognizant.hackathon.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Handles the admin/judge access-request lifecycle: a person submits a request,
 * an existing admin approves (creating the account) or rejects it.
 */
@Service
@RequiredArgsConstructor
public class AccessRequestService {

    private final AccessRequestRepository accessRequestRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void submit(AccessRequestCreate req) {
        String email = req.email().trim().toLowerCase();

        AdminRole role = parseRole(req.role());
        if (adminUserRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account with this email already exists.");
        }
        if (accessRequestRepository.existsByEmailAndStatus(email, RequestStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A request for this email is already pending approval.");
        }

        accessRequestRepository.save(AccessRequest.builder()
                .name(req.name().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .requestedRole(role)
                .status(RequestStatus.PENDING)
                .reason(req.reason() != null ? req.reason().trim() : null)
                .build());
    }

    @Transactional(readOnly = true)
    public List<AccessRequestDto> list(RequestStatus status) {
        List<AccessRequest> rows = (status == null)
                ? accessRequestRepository.findAllByOrderByCreatedAtDesc()
                : accessRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        return accessRequestRepository.countByStatus(RequestStatus.PENDING);
    }

    @Transactional
    public void approve(Long id, String reviewerEmail) {
        AccessRequest r = getPending(id);
        // Create the account with the password the requester chose (already hashed).
        if (adminUserRepository.findByEmail(r.getEmail()).isEmpty()) {
            adminUserRepository.save(AdminUser.builder()
                    .email(r.getEmail())
                    .name(r.getName())
                    .password(r.getPasswordHash())
                    .role(r.getRequestedRole())
                    .build());
        }
        r.setStatus(RequestStatus.APPROVED);
        r.setReviewedBy(reviewerEmail);
        r.setReviewedAt(LocalDateTime.now());
        accessRequestRepository.save(r);
    }

    @Transactional
    public void reject(Long id, String reviewerEmail) {
        AccessRequest r = getPending(id);
        r.setStatus(RequestStatus.REJECTED);
        r.setReviewedBy(reviewerEmail);
        r.setReviewedAt(LocalDateTime.now());
        accessRequestRepository.save(r);
    }

    private AccessRequest getPending(Long id) {
        AccessRequest r = accessRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (r.getStatus() != RequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This request has already been reviewed.");
        }
        return r;
    }

    private AdminRole parseRole(String raw) {
        AdminRole role;
        try {
            role = AdminRole.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be ADMIN or JUDGE.");
        }
        if (role != AdminRole.ADMIN && role != AdminRole.JUDGE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be ADMIN or JUDGE.");
        }
        return role;
    }

    private AccessRequestDto toDto(AccessRequest r) {
        return new AccessRequestDto(
                r.getId(), r.getName(), r.getEmail(),
                r.getRequestedRole() != null ? r.getRequestedRole().name() : null,
                r.getStatus() != null ? r.getStatus().name() : null,
                r.getReason(), r.getCreatedAt(), r.getReviewedBy(), r.getReviewedAt());
    }
}
