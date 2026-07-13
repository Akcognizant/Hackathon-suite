package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.AuthResponse;
import com.cognizant.hackathon.dto.LoginRequest;
import com.cognizant.hackathon.dto.RegisterRequest;
import com.cognizant.hackathon.entity.AdminUser;
import com.cognizant.hackathon.entity.enums.AdminRole;
import com.cognizant.hackathon.repository.AdminUserRepository;
import com.cognizant.hackathon.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final AdminUserRepository adminUserRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim();

        // Any registered account may log in (participants may use non-cognizant emails).
        // Throws BadCredentialsException on invalid email/password.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        AdminUser admin = adminUserRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        String token = jwtService.generateToken(userDetails);
        return new AuthResponse(token, admin.getEmail(), admin.getRole().name());
    }

    /**
     * Self-service participant registration. Open to any email; the account is
     * always created with the PARTICIPANT role. Returns a ready-to-use token so
     * the client can proceed straight into the app without a second round-trip.
     */
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (adminUserRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account with this email already exists");
        }

        AdminUser account = AdminUser.builder()
                .email(email)
                .name(request.name().trim())
                .password(passwordEncoder.encode(request.password()))
                .role(AdminRole.PARTICIPANT)
                .build();
        adminUserRepository.save(account);

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtService.generateToken(userDetails);
        return new AuthResponse(token, account.getEmail(), account.getRole().name());
    }
}
