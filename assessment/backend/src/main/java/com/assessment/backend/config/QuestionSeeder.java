package com.assessment.backend.config;

import com.assessment.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Seeds the Section-2 drag-activity pool from {@code drag_questions_pool.json} on
 * startup, mirroring the {@link PasswordHashMigration} CommandLineRunner pattern.
 *
 * The JSON is handed to Postgres verbatim; the DB parses it (jsonb_array_elements),
 * so no JSON library is needed on the compile classpath. Idempotent and self-healing:
 *   1. Deletes any drag question NOT in the pool that no attempt references — this
 *      removes the old generic seed activities without breaking response FKs.
 *   2. Inserts only pool questions whose question_text is not already present.
 * Running it repeatedly is a no-op once the pool is in place.
 *
 * SessionService then draws 10 (2 per type) at random via findBalancedActivities().
 */
@Component
@RequiredArgsConstructor
public class QuestionSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(QuestionSeeder.class);
    private static final String POOL_RESOURCE = "drag_questions_pool.json";

    private final QuestionRepository questionRepository;

    @Override
    public void run(String... args) throws Exception {
        ClassPathResource res = new ClassPathResource(POOL_RESOURCE);
        if (!res.exists()) {
            log.warn("Drag seed: {} not found on classpath; skipping.", POOL_RESOURCE);
            return;
        }

        String json;
        try (InputStream in = res.getInputStream()) {
            json = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
        if (json.isBlank()) {
            log.warn("Drag seed: pool file is empty; skipping.");
            return;
        }

        int removed = questionRepository.deleteDragQuestionsNotInPool(json);
        if (removed > 0) {
            log.info("Drag seed: removed {} legacy/out-of-pool activity(ies).", removed);
        }

        int inserted = questionRepository.insertMissingDragQuestions(json);
        if (inserted > 0) {
            log.info("Drag seed: inserted {} activity question(s) into the pool.", inserted);
        } else {
            log.info("Drag seed: pool already present; nothing to insert.");
        }
    }
}
