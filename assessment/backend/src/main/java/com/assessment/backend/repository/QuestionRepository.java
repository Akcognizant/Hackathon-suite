package com.assessment.backend.repository;

import com.assessment.backend.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    // Section 2 (drag activities): the fixed set, in a stable order.
    @Query(value = "SELECT * FROM questions WHERE section = 'drag' ORDER BY created_at, id",
           nativeQuery = true)
    List<Question> findActivities();
}
