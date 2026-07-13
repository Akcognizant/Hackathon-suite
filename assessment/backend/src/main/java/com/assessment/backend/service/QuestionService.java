package com.assessment.backend.service;

import com.assessment.backend.dto.questions.QuestionDto;
import com.assessment.backend.model.Question;
import com.assessment.backend.repository.QuestionRepository;
import com.assessment.backend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final SessionRepository sessionRepository;

    private static final int MAX_ATTEMPTS = 3;
    private static final int QUESTIONS_PER_ATTEMPT = 10;

    public List<QuestionDto> getQuestionsForCandidate(UUID candidateId) {

        // 1. Check attempt limit
        int completedAttempts = sessionRepository
                .countCompletedByCandidate(candidateId);

        if (completedAttempts >= MAX_ATTEMPTS) {
            throw new RuntimeException(
                    "You have used all " + MAX_ATTEMPTS + " attempts.");
        }

        // 2. Get unseen questions
        List<Question> unseen = questionRepository
                .findUnseenQuestions(candidateId);

        // 3. Fallback if not enough unseen
        if (unseen.size() < QUESTIONS_PER_ATTEMPT) {
            return questionRepository.findTenRandom()
                    .stream().map(this::toDto).collect(Collectors.toList());
        }

        return unseen.stream().map(this::toDto).collect(Collectors.toList());
    }

    private QuestionDto toDto(Question q) {
        return new QuestionDto(
                q.getId(),
                q.getSection(),
                q.getQuestionType(),
                q.getQuestionText(),
                q.getPrompt(),
                q.getPatternData(),
                q.getOptions(),
                q.getItems(),
                q.getZones(),
                q.getSuffix()
        );
    }
}