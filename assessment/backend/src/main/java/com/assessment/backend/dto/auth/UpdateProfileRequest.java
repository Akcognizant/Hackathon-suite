package com.assessment.backend.dto.auth;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String email;
}