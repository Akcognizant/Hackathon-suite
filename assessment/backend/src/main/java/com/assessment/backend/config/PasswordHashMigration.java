package com.assessment.backend.config;

import com.assessment.backend.model.Candidate;
import com.assessment.backend.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * One-time migration: any candidate whose password_hash is still stored as plain
 * text (i.e. not a bcrypt hash) is re-hashed on startup. Safe to run repeatedly —
 * rows already in bcrypt format ("$2...") are left untouched.
 */
@Component
@RequiredArgsConstructor
public class PasswordHashMigration implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PasswordHashMigration.class);

    private final CandidateRepository candidateRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        List<Candidate> candidates = candidateRepository.findAll();
        int migrated = 0;
        for (Candidate c : candidates) {
            String hash = c.getPasswordHash();
            if (hash != null && !hash.startsWith("$2")) {
                // The stored value is the raw password → hash it in place.
                c.setPasswordHash(passwordEncoder.encode(hash));
                candidateRepository.save(c);
                migrated++;
            }
        }
        if (migrated > 0) {
            log.info("Password migration: re-hashed {} plaintext password(s) to bcrypt.", migrated);
        }
    }
}
