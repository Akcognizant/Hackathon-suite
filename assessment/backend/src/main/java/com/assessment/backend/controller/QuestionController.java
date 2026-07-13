package com.assessment.backend.controller;

import com.assessment.backend.dto.questions.QuestionDto;
import com.assessment.backend.model.Question;
import com.assessment.backend.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    // GET /api/questions?candidateId=xxx
    @GetMapping
    public ResponseEntity<?> getQuestions(@RequestParam UUID candidateId) {
        try {
            List<QuestionDto> questions = questionService.getQuestionsForCandidate(candidateId);
            return ResponseEntity.ok(questions);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }
}