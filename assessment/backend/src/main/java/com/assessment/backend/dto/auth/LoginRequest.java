package com.assessment.backend.dto.auth;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}