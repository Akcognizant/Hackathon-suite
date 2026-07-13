package com.assessment.backend.service;

import org.springframework.stereotype.Service;

/**
 * Scoring rules for an assessment attempt.
 *
 * An attempt has {@code QUESTIONS_PER_ATTEMPT} (10) questions, each worth
 * {@code POINTS_PER_CORRECT} (10) points, for a maximum score of 100.
 * Adjust these constants if the scoring model changes.
 */
@Service
public class ScoreService {

    private static final int POINTS_PER_CORRECT = 10;

    /** Final score out of 100: 10 points per correct answer. */
    public int calculateScore(int correct) {
        return correct * POINTS_PER_CORRECT;
    }

    /** Accuracy as a percentage (0–100), rounded to two decimals. */
    public double calculateAccuracy(int correct, int total) {
        if (total == 0) {
            return 0.0;
        }
        return Math.round(correct * 10000.0 / total) / 100.0;
    }
}
