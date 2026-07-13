package com.assessment.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private CandidateDto candidate;

    @Data
    @AllArgsConstructor
    public static class CandidateDto {
        private UUID id;
        private String username;
        private String email;
        private String name;
    }
}