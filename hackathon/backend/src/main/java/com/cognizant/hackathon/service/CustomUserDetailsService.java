package com.cognizant.hackathon.service;

import com.cognizant.hackathon.entity.AdminUser;
import com.cognizant.hackathon.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminUserRepository adminUserRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AdminUser admin = adminUserRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found: " + email));

        return User.builder()
                .username(admin.getEmail())
                .password(admin.getPassword())
                .authorities("ROLE_" + admin.getRole().name())
                .build();
    }
}
