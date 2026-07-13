package com.assessment.backend.dto.auth;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String username;
    private String password;
}