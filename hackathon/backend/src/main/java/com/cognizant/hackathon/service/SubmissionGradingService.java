package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.GradingResultDto;
import com.cognizant.hackathon.entity.RubricCriterion;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.exception.AiUnavailableException;
import com.cognizant.hackathon.exception.RepositoryNotAccessibleException;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.RubricCriterionRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * AI 'Grading Assistant': validates a submission's GitHub link, feeds the link plus
 * the hackathon's rubric to the AI Navigator ({@link AiService}), and parses a
 * structured per-criterion result. Scores are clamped to each criterion's max.
 *
 * <p>Live inspection: calls the AI Navigator with WebFetch ENABLED so it fetches the
 * GitHub repo (structure/README/quality). If the repo is private/404, the model returns
 * an error marker which we surface as {@link RepositoryNotAccessibleException} (HTTP 422).
 */
@Service
@Slf4j
public class SubmissionGradingService {

    private static final Pattern GITHUB_URL =
            Pattern.compile("^https://(www\\.)?github\\.com/[^/\\s]+/[^/\\s]+.*$", Pattern.CASE_INSENSITIVE);

    private final SubmissionRepository submissionRepository;
    private final RubricCriterionRepository rubricCriterionRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;
    private final String gradingModel;
    private final RestTemplate restTemplate;

    public SubmissionGradingService(SubmissionRepository submissionRepository,
                                    RubricCriterionRepository rubricCriterionRepository,
                                    AiService aiService,
                                    ObjectMapper objectMapper,
                                    @Value("${ai.grading-model:sonnet}") String gradingModel) {
        this.submissionRepository = submissionRepository;
        this.rubricCriterionRepository = rubricCriterionRepository;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
        this.gradingModel = gradingModel;
        // Short timeouts so a dead/slow link fails fast — we never reach the LLM.
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Shape the LLM is asked to return; tolerant of doubles so "20.0" parses. The
     * {@code error} field is set (to REPO_NOT_ACCESSIBLE) when the repo can't be read.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RawResult(Map<String, Double> scores, String feedback, String error) {
    }

    @Transactional(readOnly = true)
    public GradingResultDto evaluate(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        String url = submission.getRepositoryUrl() == null ? "" : submission.getRepositoryUrl().trim();
        if (!GITHUB_URL.matcher(url).matches()) {
            throw new IllegalArgumentException("Repository link is invalid — a public GitHub URL is required.");
        }

        // Deterministic pre-check: a HEAD request weeds out dead/private links (4xx/5xx)
        // BEFORE we ever pay for an LLM call. Fails fast on a bad link.
        verifyAccessible(url);

        Long hackathonId = submission.getHackathon() != null ? submission.getHackathon().getId() : null;
        List<RubricCriterion> criteria = hackathonId != null
                ? rubricCriterionRepository.findByHackathonId(hackathonId)
                : List.of();
        if (criteria.isEmpty()) {
            throw new IllegalArgumentException("No evaluation criteria are configured for this hackathon.");
        }

        // Live inspection: WebFetch enabled + Sonnet (grading model) for quality analysis.
        String aiText = aiService.run(buildPrompt(url, criteria), true, gradingModel);
        return toResult(aiText, criteria);
    }

    /**
     * Deterministic HEAD probe. A 4xx/5xx (private, 404, gone) or a connection failure
     * throws {@link RepositoryNotAccessibleException} immediately — no LLM call is made.
     */
    private void verifyAccessible(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT, "Cognizant-Hackathon-Portal"); // GitHub blocks blank UAs
            restTemplate.exchange(url, HttpMethod.HEAD, new HttpEntity<>(headers), Void.class);
            // 2xx/3xx → reachable (RestTemplate throws on 4xx/5xx by default).
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            throw new RepositoryNotAccessibleException(
                    "Repository Not Accessible — it may be private or not found (HTTP "
                            + ex.getStatusCode().value() + ").");
        } catch (RestClientException ex) {
            log.warn("Repository HEAD check failed for {}: {}", url, ex.getMessage());
            throw new RepositoryNotAccessibleException(
                    "Repository Not Accessible — the link could not be reached.");
        }
    }

    private String buildPrompt(String url, List<RubricCriterion> criteria) {
        StringBuilder sb = new StringBuilder();
        sb.append("You have internet access. Access the provided GitHub repository URL. ")
          .append("Review the repository structure, the README, and the codebase quality. ")
          .append("Grade the submission based on the following rubric criteria. ")
          .append("Return the scores and feedback based on the actual content found.\n\n")
          .append("Repository: ").append(url).append("\n\nCriteria:\n");
        for (RubricCriterion c : criteria) {
            sb.append("- ").append(c.getName()).append(" (max ").append(c.getMaxPoints()).append(")\n");
        }
        sb.append("\nIf the repository is private, returns 404, or cannot be accessed, ")
          .append("respond with ONLY: {\"error\": \"REPO_NOT_ACCESSIBLE\"}\n")
          .append("Otherwise respond with ONLY this JSON (no prose, no markdown fences):\n")
          .append("{\"scores\": {");
        for (int i = 0; i < criteria.size(); i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append('"').append(criteria.get(i).getName()).append("\": <integer>");
        }
        sb.append("}, \"feedback\": \"<2-3 sentence assessment>\"}");
        return sb.toString();
    }

    private GradingResultDto toResult(String aiText, List<RubricCriterion> criteria) {
        RawResult parsed;
        try {
            parsed = objectMapper.readValue(extractJson(aiText), RawResult.class);
        } catch (Exception ex) {
            log.error("Could not parse AI grading response: {}", ex.getMessage());
            throw new AiUnavailableException("Unable to analyze the repository — the AI response was not understood.");
        }

        // Live-inspection failure: the model reported it couldn't reach the repo.
        if (parsed.error() != null && !parsed.error().isBlank()) {
            throw new RepositoryNotAccessibleException(
                    "Repository Not Accessible — it may be private or not found.");
        }

        Map<String, Double> aiScores = parsed.scores() != null ? parsed.scores() : Map.of();
        Map<String, Integer> scores = new LinkedHashMap<>();
        for (RubricCriterion c : criteria) {
            Double value = aiScores.get(c.getName());
            int clamped = value == null
                    ? 0
                    : Math.max(0, Math.min(c.getMaxPoints(), (int) Math.round(value)));
            scores.put(c.getName(), clamped);
        }
        String feedback = parsed.feedback() != null ? parsed.feedback().strip() : "";
        return new GradingResultDto(scores, feedback);
    }

    /** Pull the JSON object out of the raw CLI text (tolerates stray prose/fences). */
    private String extractJson(String text) {
        if (text == null) {
            throw new AiUnavailableException("Unable to analyze the repository — empty AI response.");
        }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new AiUnavailableException("Unable to analyze the repository — the AI response was not understood.");
        }
        return text.substring(start, end + 1);
    }
}
