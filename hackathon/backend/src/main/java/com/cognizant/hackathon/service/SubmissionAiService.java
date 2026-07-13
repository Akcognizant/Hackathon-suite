package com.cognizant.hackathon.service;

import com.cognizant.hackathon.entity.RubricCriterion;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.RubricCriterionRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import tools.jackson.databind.ObjectMapper;

import javax.net.ssl.TrustManagerFactory;
import java.security.KeyStore;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

/**
 * Evaluates a submission with Claude (Anthropic Messages API) over WebClient.
 *
 * <p>Claude is asked to return a strict JSON object {@code {"score": int, "feedback": string}};
 * the score (0-10) and feedback are persisted back onto the submission.
 */
@Service
@Slf4j
public class SubmissionAiService {

    private static final String MESSAGES_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";
    private static final String MODEL = "claude-opus-4-8";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(30);

    private final SubmissionRepository submissionRepository;
    private final RubricCriterionRepository rubricCriterionRepository;
    private final ObjectMapper objectMapper;
    private final WebClient webClient;
    private final String apiKey;

    /**
     * Demo switch. When true (the default), the real Anthropic call is skipped and a
     * canned audit is returned — no network, no API key needed. Set
     * {@code anthropic.mock-enabled=false} (and supply ANTHROPIC_API_KEY) for live calls.
     */
    @Value("${anthropic.mock-enabled:true}")
    private boolean mockEnabled;

    @Autowired
    public SubmissionAiService(SubmissionRepository submissionRepository,
                               RubricCriterionRepository rubricCriterionRepository,
                               ObjectMapper objectMapper,
                               WebClient.Builder webClientBuilder,
                               @Value("${anthropic.api-key}") String apiKey) {
        this.submissionRepository = submissionRepository;
        this.rubricCriterionRepository = rubricCriterionRepository;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;

        WebClient.Builder builder = webClientBuilder.baseUrl(MESSAGES_URL);
        // On Windows, validate against the OS "Windows-ROOT" trust store so the
        // corporate TLS-interception proxy's re-signed certificates chain to a
        // trusted root. Other platforms (e.g. Linux CI) keep the JDK default trust.
        if (System.getProperty("os.name").toLowerCase().contains("windows")) {
            builder = builder.clientConnector(windowsRootConnector());
        }
        this.webClient = builder.build();
    }

    /** Test seam: inject a ready-built WebClient directly, bypassing TLS/connector setup. */
    SubmissionAiService(SubmissionRepository submissionRepository,
                        RubricCriterionRepository rubricCriterionRepository,
                        ObjectMapper objectMapper,
                        WebClient webClient,
                        String apiKey) {
        this.submissionRepository = submissionRepository;
        this.rubricCriterionRepository = rubricCriterionRepository;
        this.objectMapper = objectMapper;
        this.webClient = webClient;
        this.apiKey = apiKey;
    }

    /**
     * Builds a Reactor Netty connector whose SSL context trusts the Windows-ROOT
     * keystore. This does NOT disable validation — it adds the corporate CA
     * (installed in the OS trusted-root store) to the trust chain.
     */
    private static ReactorClientHttpConnector windowsRootConnector() {
        try {
            KeyStore windowsRoot = KeyStore.getInstance("Windows-ROOT");
            windowsRoot.load(null, null); // OS-backed store; no password/stream

            TrustManagerFactory trustManagerFactory =
                    TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            trustManagerFactory.init(windowsRoot);

            SslContext sslContext = SslContextBuilder.forClient()
                    .trustManager(trustManagerFactory)
                    .build();

            HttpClient httpClient = HttpClient.create()
                    .secure(spec -> spec.sslContext(sslContext));

            return new ReactorClientHttpConnector(httpClient);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to initialize Windows-ROOT trust store for the Anthropic WebClient", e);
        }
    }

    /** Fetch the submission, evaluate it (live Claude call or demo stub), and persist the result. */
    public Submission evaluateSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Submission not found with id: " + submissionId));

        Evaluation evaluation = mockEnabled ? mockEvaluation() : callClaude(submissionId, submission);

        // Persist into the AI-specific columns — never the human rubric `score`.
        submission.setAiScore(evaluation.score());
        submission.setAiFeedback(evaluation.feedback());
        Submission saved = submissionRepository.save(submission);

        log.info("AI evaluation [{}] for submission {} — aiScore {}",
                mockEnabled ? "mock" : "live", submissionId, evaluation.score());
        return saved;
    }

    /** Demo stub: a canned successful audit, returned with no network call and no API key. */
    private Evaluation mockEvaluation() {
        return new Evaluation(8, "Great work, solid implementation of microservices architecture!");
    }

    /** Live path: prompt Claude over WebClient and parse the JSON reply into an Evaluation. */
    private Evaluation callClaude(Long submissionId, Submission submission) {
        String systemPrompt = buildSystemPrompt(submission);
        String userPrompt = """
                Project title: %s
                Repository: %s

                Score this project. Respond with ONLY a JSON object — no prose, no markdown fences —
                of exactly this shape: { "score": <integer 0-10>, "feedback": "<2-3 sentences referencing the rubric>" }
                """.formatted(submission.getProjectTitle(), submission.getRepositoryUrl());

        Map<String, Object> requestBody = Map.of(
                "model", MODEL,
                "max_tokens", 1024,
                "system", systemPrompt,
                "messages", List.of(Map.of("role", "user", "content", userPrompt)));

        try {
            ClaudeResponse response = webClient.post()
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", ANTHROPIC_VERSION)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    // Capture the FULL Anthropic error body (not just the status) so the
                    // real complaint is visible in the logs, then fail the pipeline.
                    .onStatus(HttpStatusCode::isError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .defaultIfEmpty("(empty error body)")
                                    .flatMap(errorBody -> {
                                        log.error("Anthropic API returned {} for submission {} — body: {}",
                                                clientResponse.statusCode().value(), submissionId, errorBody);
                                        return Mono.error(new IllegalStateException(
                                                "Anthropic API error " + clientResponse.statusCode().value()
                                                        + ": " + errorBody));
                                    }))
                    .bodyToMono(ClaudeResponse.class)
                    // Fail fast if Anthropic is slow; emits TimeoutException after 30s.
                    .timeout(REQUEST_TIMEOUT)
                    .block();

            String rawText = firstTextBlock(response);
            return objectMapper.readValue(stripJsonFences(rawText), Evaluation.class);

        } catch (Exception e) {
            if (isTimeout(e)) {
                log.error("Anthropic API call timed out after {}s for submission {}",
                        REQUEST_TIMEOUT.toSeconds(), submissionId);
                throw new IllegalStateException(
                        "AI evaluation timed out for submission " + submissionId, e);
            }
            // Surface and log any other API/parse failure; the global handler maps this to a 500.
            log.error("AI evaluation failed for submission {}: {}", submissionId, e.getMessage(), e);
            throw new IllegalStateException("AI evaluation failed for submission " + submissionId, e);
        }
    }

    /**
     * Builds the Anthropic system prompt, dynamically injecting the hackathon's
     * configured evaluation criteria (name + max score). Falls back to a generic
     * prompt when the submission has no hackathon or no criteria are configured.
     */
    private String buildSystemPrompt(Submission submission) {
        Long hackathonId = submission.getHackathon() != null ? submission.getHackathon().getId() : null;
        List<RubricCriterion> criteria = hackathonId != null
                ? rubricCriterionRepository.findByHackathonId(hackathonId)
                : List.of();

        if (criteria.isEmpty()) {
            return "You are a senior engineer reviewing a hackathon project. "
                    + "Evaluate its overall technical quality, innovation, and execution.";
        }

        String rubric = criteria.stream()
                .map(c -> "- " + c.getName() + " (max " + c.getMaxPoints() + " points)")
                .collect(Collectors.joining("\n"));
        return "You are a senior engineer reviewing a hackathon project. "
                + "Evaluate it specifically against this rubric:\n" + rubric
                + "\n\nWeigh each criterion, then give an overall 0-10 score and feedback that references them.";
    }

    /** Reactor wraps the checked TimeoutException, so check both the throwable and its cause. */
    private static boolean isTimeout(Throwable e) {
        return e instanceof TimeoutException || e.getCause() instanceof TimeoutException;
    }

    private static String firstTextBlock(ClaudeResponse response) {
        if (response == null || response.content() == null) {
            throw new IllegalStateException("Empty response from Claude");
        }
        return response.content().stream()
                .filter(block -> "text".equals(block.type()) && block.text() != null)
                .map(ContentBlock::text)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No text block in Claude response"));
    }

    /** Defensive: strip ```json ... ``` fences if the model wraps the JSON despite instructions. */
    private static String stripJsonFences(String text) {
        String trimmed = text.strip();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceAll("(?s)^```(?:json)?\\s*", "").replaceAll("\\s*```$", "");
        }
        return trimmed.strip();
    }

    // --- Response shapes (unknown fields like id/model/usage are ignored) ---

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ClaudeResponse(List<ContentBlock> content) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ContentBlock(String type, String text) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Evaluation(int score, String feedback) {
    }
}
