package com.assessment.backend.service;

import com.assessment.backend.dto.auth.*;
import com.assessment.backend.exception.DuplicateResourceException;
import com.assessment.backend.exception.InvalidCredentialsException;
import com.assessment.backend.exception.ResourceNotFoundException;
import com.assessment.backend.model.Candidate;
import com.assessment.backend.repository.CandidateRepository;
import com.assessment.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CandidateRepository candidateRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    // ── Login ──────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {

        // 1. Find candidate by username
        Candidate candidate = candidateRepository
                .findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));

        // 2. Verify password against the stored bcrypt hash
        if (!passwordEncoder.matches(request.getPassword(), candidate.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        return buildAuthResponse(candidate);
    }

    // ── Register 
    public AuthResponse register(RegisterRequest request) {

        // 1. Check username not already taken
        if (candidateRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username is already taken");
        }

        // 2. Check email not already taken
        if (candidateRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered");
        }

        // 3. Build and save candidate
        Candidate candidate = new Candidate();
        candidate.setName(request.getName());
        candidate.setEmail(request.getEmail());
        candidate.setUsername(request.getUsername());
        candidate.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        candidateRepository.save(candidate);

        return buildAuthResponse(candidate);
    }

    // ── Update profile 
    public AuthResponse updateProfile(UUID candidateId, UpdateProfileRequest request) {

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found"));

        // Check email not taken by someone else
        if (!candidate.getEmail().equals(request.getEmail()) &&
                candidateRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already in use");
        }

        candidate.setName(request.getName());
        candidate.setEmail(request.getEmail());
        candidateRepository.save(candidate);

        return buildAuthResponse(candidate);
    }

    // ── Update password 
    public void updatePassword(UUID candidateId, UpdatePasswordRequest request) {

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found"));

        // Verify current password against the stored bcrypt hash
        if (!passwordEncoder.matches(request.getCurrentPassword(), candidate.getPasswordHash())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        candidate.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        candidateRepository.save(candidate);
    }

    // ── Helper 
    private AuthResponse buildAuthResponse(Candidate candidate) {
        AuthResponse.CandidateDto dto = new AuthResponse.CandidateDto(
                candidate.getId(),
                candidate.getUsername(),
                candidate.getEmail(),
                candidate.getName()
        );
        return new AuthResponse(jwtService.generateToken(candidate), dto);
    }
}