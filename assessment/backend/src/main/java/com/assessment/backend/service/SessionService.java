package com.assessment.backend.service;

import com.assessment.backend.dto.questions.QuestionDto;
import com.assessment.backend.dto.sessions.*;
import com.assessment.backend.model.*;
import com.assessment.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final ResponseRepository responseRepository;
    private final CandidateRepository candidateRepository;
    private final QuestionRepository questionRepository;

    private static final int MAX_ATTEMPTS = 3;
    // Fixed 20-minute limit for the whole 2-section attempt (10 MCQ + 5 activities).
    private static final int TIME_LIMIT_SECONDS = 20 * 60;
    // Minimum accuracy (%) to pass and unlock the hackathon portal.
    private static final double PASS_THRESHOLD = 75.0;

    // ── Start or resume an attempt ───────────────────────────────────────────
    @Transactional
    public SessionStartResponse startOrResume(UUID candidateId) {

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        Optional<AssessmentSession> existing = sessionRepository
                .findFirstByCandidate_IdAndStatusOrderByStartedAtDesc(candidateId, "IN_PROGRESS");

        if (existing.isPresent()) {
            AssessmentSession session = existing.get();
            List<Response> rows = responseRepository.findBySessionIdOrderByDisplayOrder(session.getId());
            if (rows.isEmpty()) {
                sessionRepository.delete(session); // abandoned/legacy → discard, start fresh
            } else {
                long remaining = remainingSeconds(session);
                if (remaining <= 0) {
                    finalizeSession(session, rows);
                    return SessionStartResponse.expired(session.getId());
                }
                return buildStartResponse(session, true, remaining);
            }
        }

        // Once passed, further attempts are locked — proceed to the hackathon instead.
        if (hasPassed(candidateId)) {
            throw new RuntimeException("You have already passed the assessment. Proceed to the hackathon.");
        }

        int completed = sessionRepository.countCompletedByCandidate(candidateId);
        if (completed >= MAX_ATTEMPTS) {
            throw new RuntimeException("You have used all " + MAX_ATTEMPTS + " attempts");
        }

        AssessmentSession session = new AssessmentSession();
        session.setCandidate(candidate);
        session.setAttemptNumber(sessionRepository.getNextAttemptNumber(candidateId));
        session.setStatus("IN_PROGRESS");
        session.setStartedAt(LocalDateTime.now());
        sessionRepository.save(session);

        // Pin the attempt: section 1 = 10 random MCQs, section 2 = the fixed drag activities.
        int order = 0;
        for (Question q : pickPatternQuestions(candidateId)) pinResponse(session, q, order++);
        for (Question q : questionRepository.findActivities())  pinResponse(session, q, order++);

        return buildStartResponse(session, false, TIME_LIMIT_SECONDS);
    }

    // ── Autosave a single question/activity during the attempt ───────────────
    @Transactional
    public void saveResponse(UUID sessionId, AutosaveRequest req) {
        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if (!"IN_PROGRESS".equals(session.getStatus())) return;

        Response r = responseRepository
                .findBySession_IdAndQuestion_Id(sessionId, req.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Question is not part of this attempt"));

        r.setSelectedOptionIndex(req.getSelectedOptionIndex());
        r.setAnswer(req.getAnswer());
        if (req.getEvents() != null) r.setEvents(req.getEvents());
        if (req.getDragAttempts() != null) r.setDragAttempts(req.getDragAttempts());
        if (req.getTimeTakenSeconds() != null) r.setTimeTakenSeconds(req.getTimeTakenSeconds());
        if (req.getAttemptCount() != null) r.setAttemptCount(req.getAttemptCount());
        responseRepository.save(r);
    }

    // ── Submit / finalize an attempt ─────────────────────────────────────────
    @Transactional
    public ResultResponse submitSession(UUID sessionId, SubmitRequest request) {
        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if ("COMPLETED".equals(session.getStatus())) {
            return getResult(sessionId);
        }

        Map<UUID, Response> byQuestion = responseRepository.findBySessionIdOrderByDisplayOrder(sessionId)
                .stream().collect(Collectors.toMap(
                        r -> r.getQuestion().getId(), r -> r, (a, b) -> a, LinkedHashMap::new));

        if (request != null && request.getResponses() != null) {
            for (ResponseDto dto : request.getResponses()) {
                Response r = byQuestion.get(dto.getQuestionId());
                if (r == null) continue;
                r.setSelectedOptionIndex(dto.getSelectedOptionIndex());
                r.setAnswer(dto.getAnswer());
                if (dto.getEvents() != null) r.setEvents(dto.getEvents());
                if (dto.getDragAttempts() != null) r.setDragAttempts(dto.getDragAttempts());
                if (dto.getTimeTakenSeconds() != null) r.setTimeTakenSeconds(dto.getTimeTakenSeconds());
                if (dto.getAttemptCount() != null) r.setAttemptCount(dto.getAttemptCount());
            }
        }

        return finalizeSession(session, new ArrayList<>(byQuestion.values()));
    }

    // ── Get result ───────────────────────────────────────────────────────────
    public ResultResponse getResult(UUID sessionId) {
        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        return buildResultResponse(session, responseRepository.findBySessionIdOrderByDisplayOrder(sessionId));
    }

    // ── Get analytics ──────────────────────────────────────────────────────
    public AnalyticsResponse getAnalytics(UUID sessionId) {
        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        List<Response> rows = responseRepository.findBySessionIdOrderByDisplayOrder(sessionId);

        int correct = 0, attemptedWrong = 0, skipped = 0, totalAttempts = 0, totalDrag = 0, totalIncorrect = 0, timeSum = 0;
        List<AnalyticsResponse.QuestionAnalytics> perQuestion = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            Response r = rows.get(i);
            int cc = nz(r.getCorrectCount()), tc = nz(r.getTotalCount());
            correct += cc;
            boolean attempted = isAttempted(r);
            if (attempted) attemptedWrong += (tc - cc); else skipped += tc;
            totalAttempts += nz(r.getAttemptCount());
            totalDrag += nz(r.getDragAttempts());
            totalIncorrect += nz(r.getIncorrectPlacements());
            timeSum += nz(r.getTimeTakenSeconds());
            perQuestion.add(new AnalyticsResponse.QuestionAnalytics(
                    "Q" + (i + 1),
                    r.getQuestion().getSection(),
                    r.getQuestion().getQuestionType(),
                    r.getQuestion().getQuestionText(),
                    nz(r.getTimeTakenSeconds()),
                    nz(r.getAttemptCount()),
                    nz(r.getIncorrectPlacements()),
                    statusOf(r)));
        }
        int avgTime = rows.isEmpty() ? 0 : Math.round((float) timeSum / rows.size());

        // Accuracy by section
        List<AnalyticsResponse.SectionBreakdown> sections = new ArrayList<>();
        for (String sec : List.of("pattern", "drag")) {
            List<Response> inSec = rows.stream()
                    .filter(r -> sec.equals(r.getQuestion().getSection())).collect(Collectors.toList());
            if (inSec.isEmpty()) continue;
            int total = inSec.stream().mapToInt(r -> nz(r.getTotalCount())).sum();
            int corr = inSec.stream().mapToInt(r -> nz(r.getCorrectCount())).sum();
            int acc = total > 0 ? Math.round(corr * 100f / total) : 0;
            sections.add(new AnalyticsResponse.SectionBreakdown(sec, total, corr, acc));
        }

        Integer max = session.getMaxScore();
        double accuracy = max != null && max > 0 ? Math.round(correct * 10000.0 / max) / 100.0 : 0.0;

        return new AnalyticsResponse(
                sessionId, session.getTotalTimeSeconds(),
                correct, attemptedWrong, skipped, accuracy,
                avgTime, totalAttempts, totalDrag, totalIncorrect,
                perQuestion, sections);
    }

    // ── Get history (for dashboard) ────────────────────────────────────────
    public List<Map<String, Object>> getHistory(UUID candidateId) {
        return sessionRepository.findCompletedByCandidate(candidateId).stream().map(s -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("sessionId", s.getId());
            entry.put("attemptNumber", s.getAttemptNumber());
            entry.put("date", s.getCompletedAt());
            entry.put("score", s.getFinalScore());
            entry.put("maxScore", s.getMaxScore());
            entry.put("accuracy", s.getAccuracyPercentage());
            entry.put("totalTimeSeconds", s.getTotalTimeSeconds());
            entry.put("status", s.getStatus());
            return entry;
        }).collect(Collectors.toList());
    }

    // ── Hackathon gate ───────────────────────────────────────────────────────

    /** True once the candidate has any completed attempt at or above the pass threshold. */
    public boolean hasPassed(UUID candidateId) {
        return sessionRepository.findCompletedByCandidate(candidateId).stream()
                .anyMatch(s -> s.getAccuracyPercentage() != null
                        && s.getAccuracyPercentage() >= PASS_THRESHOLD);
    }

    /** Gate status for the frontend: passed / blocked / attempts / best accuracy. */
    public Map<String, Object> getGateStatus(UUID candidateId) {
        List<AssessmentSession> completed = sessionRepository.findCompletedByCandidate(candidateId);
        boolean passed = completed.stream()
                .anyMatch(s -> s.getAccuracyPercentage() != null
                        && s.getAccuracyPercentage() >= PASS_THRESHOLD);
        int used = completed.size();
        double best = completed.stream()
                .filter(s -> s.getAccuracyPercentage() != null)
                .mapToDouble(AssessmentSession::getAccuracyPercentage)
                .max().orElse(0.0);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("passed", passed);
        out.put("blocked", !passed && used >= MAX_ATTEMPTS);
        out.put("attemptsUsed", used);
        out.put("attemptsRemaining", Math.max(0, MAX_ATTEMPTS - used));
        out.put("maxAttempts", MAX_ATTEMPTS);
        out.put("bestAccuracy", best);
        out.put("passThreshold", PASS_THRESHOLD);
        return out;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void pinResponse(AssessmentSession session, Question q, int order) {
        Response r = new Response();
        r.setSession(session);
        r.setQuestion(q);
        r.setDisplayOrder(order);
        r.setTimeTakenSeconds(0);
        r.setAttemptCount(0);
        r.setDragAttempts(0);
        r.setIncorrectPlacements(0);
        r.setCorrectCount(0);
        r.setTotalCount(0);
        responseRepository.save(r);
    }

    private List<Question> pickPatternQuestions(UUID candidateId) {
        List<Question> unseen = questionRepository.findUnseenQuestions(candidateId);
        return unseen.size() < 10 ? questionRepository.findTenRandom() : unseen;
    }

    private long remainingSeconds(AssessmentSession session) {
        long elapsed = ChronoUnit.SECONDS.between(session.getStartedAt(), LocalDateTime.now());
        return TIME_LIMIT_SECONDS - elapsed;
    }

    private QuestionDto toQuestionDto(Question q) {
        return new QuestionDto(
                q.getId(), q.getSection(), q.getQuestionType(), q.getQuestionText(), q.getPrompt(),
                q.getPatternData(), q.getOptions(), q.getItems(), q.getZones(), q.getSuffix());
    }

    private SessionStartResponse buildStartResponse(AssessmentSession session, boolean resumed, long remaining) {
        List<Response> rows = responseRepository.findBySessionIdOrderByDisplayOrder(session.getId());
        List<QuestionDto> questions = rows.stream().map(r -> toQuestionDto(r.getQuestion())).collect(Collectors.toList());
        List<SavedResponseDto> saved = rows.stream().map(r -> new SavedResponseDto(
                r.getQuestion().getId(), r.getSelectedOptionIndex(), r.getAnswer(),
                r.getDragAttempts(), r.getTimeTakenSeconds(), r.getAttemptCount())).collect(Collectors.toList());
        return new SessionStartResponse(
                session.getId(), session.getAttemptNumber(),
                TIME_LIMIT_SECONDS, Math.max(0, remaining), resumed, false, questions, saved);
    }

    private ResultResponse finalizeSession(AssessmentSession session, List<Response> rows) {
        rows.sort(Comparator.comparingInt(r -> nz(r.getDisplayOrder())));
        int totalScore = 0, maxScore = 0;
        for (Response r : rows) {
            gradeResponse(r);
            totalScore += nz(r.getCorrectCount());
            maxScore += nz(r.getTotalCount());
            responseRepository.save(r);
        }
        double accuracy = maxScore > 0 ? Math.round(totalScore * 10000.0 / maxScore) / 100.0 : 0.0;
        long elapsed = ChronoUnit.SECONDS.between(session.getStartedAt(), LocalDateTime.now());
        int totalTime = (int) Math.min(Math.max(elapsed, 0), TIME_LIMIT_SECONDS);

        session.setStatus("COMPLETED");
        session.setCompletedAt(LocalDateTime.now());
        session.setTotalTimeSeconds(totalTime);
        session.setFinalScore(totalScore);
        session.setMaxScore(maxScore);
        session.setAccuracyPercentage(accuracy);
        sessionRepository.save(session);

        return buildResultResponse(session, rows);
    }

    /** Grade one response in place (1 point per item), for both MCQ and activities. */
    private void gradeResponse(Response r) {
        Question q = r.getQuestion();
        int cc, tc, ip = 0;
        if ("drag".equals(q.getSection())) {
            int[] s = ActivityScoring.score(q, r.getAnswer(), r.getEvents());
            cc = s[0]; tc = s[1]; ip = s[2];
        } else {
            tc = 1;
            cc = (r.getSelectedOptionIndex() != null
                    && r.getSelectedOptionIndex().equals(q.getCorrectOptionIndex())) ? 1 : 0;
        }
        r.setCorrectCount(cc);
        r.setTotalCount(tc);
        r.setIncorrectPlacements(ip);
        r.setIsCorrect(tc > 0 && cc == tc);
    }

    private ResultResponse buildResultResponse(AssessmentSession session, List<Response> rows) {
        int correct = 0, incorrect = 0, skipped = 0;
        List<ResultResponse.QuestionResult> results = new ArrayList<>();

        for (Response r : rows) {
            Question q = r.getQuestion();
            int cc = nz(r.getCorrectCount()), tc = nz(r.getTotalCount());
            correct += cc;
            boolean attempted = isAttempted(r);
            if (attempted) incorrect += (tc - cc); else skipped += tc;

            String selectedOption = null, correctOption = null;
            Integer correctIdx = null;
            if ("pattern".equals(q.getSection()) && q.getOptions() instanceof List<?> opts) {
                correctIdx = q.getCorrectOptionIndex();
                if (r.getSelectedOptionIndex() != null && r.getSelectedOptionIndex() < opts.size())
                    selectedOption = String.valueOf(opts.get(r.getSelectedOptionIndex()));
                if (correctIdx != null && correctIdx < opts.size())
                    correctOption = String.valueOf(opts.get(correctIdx));
            }

            results.add(new ResultResponse.QuestionResult(
                    q.getId(), q.getSection(), q.getQuestionType(), q.getQuestionText(),
                    cc, tc,
                    r.getSelectedOptionIndex(), correctIdx, selectedOption, correctOption,
                    r.getIncorrectPlacements(), r.getDragAttempts(),
                    r.getIsCorrect(), !attempted, r.getTimeTakenSeconds(), r.getAttemptCount()));
        }

        return new ResultResponse(
                session.getId(),
                session.getCandidate().getName(),
                session.getAttemptNumber(),
                rows.size(),
                correct, incorrect, skipped,
                session.getAccuracyPercentage() != null ? session.getAccuracyPercentage() : 0.0,
                session.getFinalScore(), session.getMaxScore(),
                session.getTotalTimeSeconds(),
                results);
    }

    private boolean isAttempted(Response r) {
        return "drag".equals(r.getQuestion().getSection())
                ? r.getAnswer() != null
                : r.getSelectedOptionIndex() != null;
    }

    private String statusOf(Response r) {
        if (!isAttempted(r)) return "skipped";
        int cc = nz(r.getCorrectCount()), tc = nz(r.getTotalCount());
        if (tc > 0 && cc == tc) return "correct";
        if (cc > 0) return "partial";
        return "incorrect";
    }

    private int nz(Integer v) {
        return v == null ? 0 : v;
    }
}
