package com.cognizant.hackathon.service;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.repository.RubricCriterionRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Mock integration test for {@link SubmissionAiService} — exercises the full
 * evaluate-and-persist flow with the Anthropic call faked out, so it runs
 * locally with no network access and no API key.
 */
@ExtendWith(MockitoExtension.class)
@SuppressWarnings({"rawtypes", "unchecked"}) // raw WebClient spec mocks
class SubmissionAiServiceTest {

    @Mock
    private SubmissionRepository submissionRepository;
    @Mock
    private RubricCriterionRepository rubricCriterionRepository;

    // WebClient fluent-chain mocks.
    @Mock
    private WebClient webClient;
    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;
    @Mock
    private WebClient.RequestBodySpec requestBodySpec;
    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock
    private WebClient.ResponseSpec responseSpec;

    // Real Jackson mapper so the inner JSON is genuinely parsed.
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Captures the ERROR logs the service emits via @Slf4j.
    private ListAppender<ILoggingEvent> logWatcher;

    @BeforeEach
    void attachLogWatcher() {
        logWatcher = new ListAppender<>();
        logWatcher.start();
        ((Logger) LoggerFactory.getLogger(SubmissionAiService.class)).addAppender(logWatcher);
    }

    @AfterEach
    void detachLogWatcher() {
        ((Logger) LoggerFactory.getLogger(SubmissionAiService.class)).detachAppender(logWatcher);
    }

    @Test
    void evaluateSubmission_parsesClaudeJson_andStoresAiScoreAndFeedback() {
        // --- Arrange: dummy submission ---
        Submission submission = Submission.builder()
                .id(1L)
                .projectTitle("CostGuard")
                .repositoryUrl("https://github.com/acme/costguard")
                .build();
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(submission));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(inv -> inv.getArgument(0));

        // --- Arrange: simulated Anthropic response with the expected JSON payload ---
        SubmissionAiService.ClaudeResponse claudeResponse = new SubmissionAiService.ClaudeResponse(
                List.of(new SubmissionAiService.ContentBlock(
                        "text", "{ \"score\": 8, \"feedback\": \"Great work\" }")));

        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.header(anyString(), any())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), any())).thenReturn(requestBodySpec);
        when(requestBodySpec.contentType(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(SubmissionAiService.ClaudeResponse.class))
                .thenReturn(Mono.just(claudeResponse));

        SubmissionAiService service =
                new SubmissionAiService(submissionRepository, rubricCriterionRepository, objectMapper, webClient, "test-key");

        // --- Act ---
        Submission result = service.evaluateSubmission(1L);

        // --- Assert: parsed values landed on the AI-specific fields ---
        assertEquals(8, result.getAiScore().intValue());
        assertEquals("Great work", result.getAiFeedback());
        verify(submissionRepository).save(submission);

        // --- Assert: the prompt sent to the API carried the project title + repo URL ---
        ArgumentCaptor<Object> bodyCaptor = ArgumentCaptor.forClass(Object.class);
        verify(requestBodySpec).bodyValue(bodyCaptor.capture());

        Map<?, ?> requestBody = (Map<?, ?>) bodyCaptor.getValue();
        List<?> messages = (List<?>) requestBody.get("messages");
        Map<?, ?> firstMessage = (Map<?, ?>) messages.get(0);
        String prompt = (String) firstMessage.get("content");

        assertTrue(prompt.contains("CostGuard"), "prompt should contain the project title");
        assertTrue(prompt.contains("https://github.com/acme/costguard"),
                "prompt should contain the repository URL");
    }

    @Test
    void evaluateSubmission_apiError_rethrowsIllegalStateAndLogs() {
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(dummySubmission()));
        stubWebClientChain();

        WebClientResponseException unauthorized =
                new WebClientResponseException(401, "Unauthorized", null, null, null);
        when(responseSpec.bodyToMono(SubmissionAiService.ClaudeResponse.class))
                .thenReturn(Mono.error(unauthorized));

        SubmissionAiService service =
                new SubmissionAiService(submissionRepository, rubricCriterionRepository, objectMapper, webClient, "test-key");

        IllegalStateException thrown = assertThrows(IllegalStateException.class,
                () -> service.evaluateSubmission(1L));

        assertTrue(thrown.getMessage().contains("AI evaluation failed for submission 1"));
        assertTrue(thrown.getCause() instanceof WebClientResponseException,
                "original API exception should be the cause");
        verify(submissionRepository, never()).save(any());
        assertErrorLogged("AI evaluation failed for submission 1");
    }

    @Test
    void evaluateSubmission_malformedJson_rethrowsIllegalStateAndLogs() {
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(dummySubmission()));
        stubWebClientChain();

        // Successful HTTP call, but the text block is not valid Evaluation JSON.
        SubmissionAiService.ClaudeResponse malformed = new SubmissionAiService.ClaudeResponse(
                List.of(new SubmissionAiService.ContentBlock("text", "{ score: 'invalid', }")));
        when(responseSpec.bodyToMono(SubmissionAiService.ClaudeResponse.class))
                .thenReturn(Mono.just(malformed));

        SubmissionAiService service =
                new SubmissionAiService(submissionRepository, rubricCriterionRepository, objectMapper, webClient, "test-key");

        IllegalStateException thrown = assertThrows(IllegalStateException.class,
                () -> service.evaluateSubmission(1L));

        assertTrue(thrown.getMessage().contains("AI evaluation failed for submission 1"));
        verify(submissionRepository, never()).save(any());
        assertErrorLogged("AI evaluation failed for submission 1");
    }

    @Test
    void evaluateSubmission_apiTimeout_rethrowsIllegalStateAndLogsTimeout() {
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(dummySubmission()));
        stubWebClientChain();

        // Simulate a slow Anthropic response. A real Mono.never() would make the
        // service's .timeout(30s) wait the full 30 seconds; emitting the same
        // TimeoutException it would raise reproduces the outcome instantly and
        // deterministically, exercising the isTimeout() branch.
        when(responseSpec.bodyToMono(SubmissionAiService.ClaudeResponse.class))
                .thenReturn(Mono.error(new TimeoutException(
                        "Did not observe any item or terminal signal within 30000ms")));

        SubmissionAiService service =
                new SubmissionAiService(submissionRepository, rubricCriterionRepository, objectMapper, webClient, "test-key");

        IllegalStateException thrown = assertThrows(IllegalStateException.class,
                () -> service.evaluateSubmission(1L));

        // Fails gracefully with the timeout-specific message...
        assertTrue(thrown.getMessage().contains("AI evaluation timed out for submission 1"));
        // ...the underlying cause is the TimeoutException (per isTimeout())...
        assertTrue(thrown.getCause() instanceof TimeoutException
                        || thrown.getCause().getCause() instanceof TimeoutException,
                "cause chain should carry the TimeoutException");
        verify(submissionRepository, never()).save(any());
        // ...and the timeout-specific ERROR log was emitted (not the generic failure log).
        assertErrorLogged("Anthropic API call timed out after 30s for submission 1");
    }

    // --- helpers ---

    private static Submission dummySubmission() {
        return Submission.builder()
                .id(1L)
                .projectTitle("CostGuard")
                .repositoryUrl("https://github.com/acme/costguard")
                .build();
    }

    /** Stubs the WebClient fluent chain up to (and including) retrieve() -> responseSpec. */
    private void stubWebClientChain() {
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.header(anyString(), any())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), any())).thenReturn(requestBodySpec);
        when(requestBodySpec.contentType(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
    }

    private void assertErrorLogged(String expectedFragment) {
        boolean logged = logWatcher.list.stream()
                .anyMatch(event -> event.getLevel() == Level.ERROR
                        && event.getFormattedMessage().contains(expectedFragment));
        assertTrue(logged, "expected an ERROR log containing: " + expectedFragment);
    }
}
