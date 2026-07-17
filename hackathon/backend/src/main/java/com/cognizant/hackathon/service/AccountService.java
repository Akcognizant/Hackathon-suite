package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.ChangePasswordRequest;
import com.cognizant.hackathon.dto.ProfileDto;
import com.cognizant.hackathon.entity.AdminUser;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Self-service account operations for the signed-in user (Profile Settings):
 * read own profile and change own password. The user is always resolved from the
 * JWT principal, so a user can only ever view/modify their own account.
 */
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public ProfileDto getProfile() {
        AdminUser me = currentUser();
        return new ProfileDto(
                me.getEmail(),
                me.getName(),
                me.getRole() != null ? me.getRole().name() : null);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        AdminUser me = currentUser();
        // Verify the current password before allowing a change.
        if (!passwordEncoder.matches(request.currentPassword(), me.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), me.getPassword())) {
            throw new IllegalArgumentException("New password must be different from the current password");
        }
        me.setPassword(passwordEncoder.encode(request.newPassword()));
        adminUserRepository.save(me);
    }

    private AdminUser currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (auth != null) ? auth.getName() : null;
        return adminUserRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + email));
    }
}
