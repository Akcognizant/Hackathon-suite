package com.assessment.backend.repository;

import com.assessment.backend.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    // Section 1 (MCQ): 10 random unseen pattern questions for a candidate.
    @Query(value = """
        SELECT * FROM questions
        WHERE section = 'pattern'
        AND id NOT IN (
            SELECT DISTINCT r.question_id
            FROM responses r
            JOIN assessment_sessions s ON r.session_id = s.id
            WHERE s.candidate_id = :candidateId
            AND s.status = 'COMPLETED'
        )
        ORDER BY RANDOM()
        LIMIT 10
        """, nativeQuery = true)
    List<Question> findUnseenQuestions(@Param("candidateId") UUID candidateId);

    // Fallback for section 1 when not enough unseen pattern questions remain.
    @Query(value = "SELECT * FROM questions WHERE section = 'pattern' ORDER BY RANDOM() LIMIT 10",
           nativeQuery = true)
    List<Question> findTenRandom();

    // Section 2 (drag activities): 10 from the pool, balanced 2 random per activity type
    // (categorize | match | sequence | rank | fill-blank) → 5 types × 2 = 10.
    @Query(value = """
        SELECT * FROM questions
        WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY question_type ORDER BY RANDOM()) AS rn
                FROM questions WHERE section = 'drag'
            ) ranked WHERE rn <= 2
        )
        ORDER BY question_type, id
        """, nativeQuery = true)
    List<Question> findBalancedActivities();

    // ── Seeding support (used by QuestionSeeder on startup) ──────────────────
    // Postgres parses the pool JSON directly (no Jackson needed on the compile
    // classpath); :json is the raw text of drag_questions_pool.json.

    // Remove legacy / out-of-pool drag questions that no attempt references (FK-safe):
    // any drag row whose question_text is not one of the pool's questionText values.
    @Modifying
    @Transactional
    @Query(value = """
        DELETE FROM questions
        WHERE section = 'drag'
        AND question_text NOT IN (
            SELECT elem->>'questionText' FROM jsonb_array_elements(CAST(:json AS jsonb)) elem
        )
        AND id NOT IN (SELECT question_id FROM responses)
        """, nativeQuery = true)
    int deleteDragQuestionsNotInPool(@Param("json") String json);

    // Insert every pool question whose question_text is not already present (idempotent).
    // items/zones/answer_key are extracted as jsonb sub-values straight into the columns.
    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO questions (section, question_text, question_type, prompt, items, zones, answer_key, suffix)
        SELECT 'drag', elem->>'questionText', elem->>'questionType', elem->>'prompt',
               elem->'items', elem->'zones', elem->'answerKey', elem->>'suffix'
        FROM jsonb_array_elements(CAST(:json AS jsonb)) elem
        WHERE elem->>'questionText' NOT IN (
            SELECT question_text FROM questions WHERE section = 'drag'
        )
        """, nativeQuery = true)
    int insertMissingDragQuestions(@Param("json") String json);
}
