package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.AiResponse;
import com.cognizant.hackathon.dto.DashboardStatsDto;
import com.cognizant.hackathon.dto.SubmissionDto;
import com.cognizant.hackathon.exception.AiUnavailableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Runs the Claude Code CLI directly (in-process — no external Node proxy) and grounds
 * every prompt with a live snapshot of the portal so the assistant can analyse real data.
 *
 * <p>The CLI is invoked as a native executable via ProcessBuilder, with the full prompt
 * delivered on STDIN — so user text never touches a shell/command line (no injection, no
 * quoting/truncation issues). Runs in a scratch dir with all tools disabled, matching the
 * previous stateless Q&A proxy.
 *
 * <p>Configurable: {@code ai.claude-bin} (path to claude.exe), {@code ai.model} (default
 * haiku for speed), {@code ai.effort} (default low).
 */
@Service
@Slf4j
public class AiService {
    
    //TURN THIS TO TRUE TO ENABLE AI
    private static final boolean AI_ENABLED = false;

    private static final int TIMEOUT_SECONDS = 120;
    // Chat/portal mode: every tool disabled. Grading mode: WebFetch allowed for live
    // URL inspection, but shell/file tools stay disabled (no local FS/command access).
    private static final String TOOLS_NONE = "Bash,Read,Edit,Write,Glob,Grep,WebFetch,WebSearch";
    private static final String TOOLS_ALLOW_WEBFETCH = "Bash,Read,Edit,Write,Glob,Grep,WebSearch";

    private static final String SYSTEM_PROMPT =
            "You are the Cognizant Hackathon Admin AI Navigator. Answer the administrator's questions "
            + "using the LIVE PORTAL DATA provided below. Be concise and specific, and cite concrete "
            + "numbers/teams from the data. If the data doesn't contain the answer, say so plainly.";

    private final String claudeBin;
    private final String model;
    private final String effort;
    private final DashboardService dashboardService;
    private final SubmissionService submissionService;

    public AiService(@Value("${ai.claude-bin:claude}") String claudeBin,
                     @Value("${ai.model:haiku}") String model,
                     @Value("${ai.effort:low}") String effort,
                     DashboardService dashboardService,
                     SubmissionService submissionService) {
        this.claudeBin = claudeBin;
        this.model = model;
        this.effort = effort;
        this.dashboardService = dashboardService;
        this.submissionService = submissionService;
    }

    /** AI Navigator chat: portal-grounded prompt, no external tools. */
    public AiResponse query(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("prompt must not be blank");
        }
        String fullPrompt = SYSTEM_PROMPT
                + "\n\n=== LIVE PORTAL DATA ===\n" + buildPortalContext()
                + "\n\n=== ADMIN QUESTION ===\n" + prompt;
        return new AiResponse(runClaude(fullPrompt, false, model));
    }

    /**
     * Runs a self-contained prompt as-is (NO portal grounding / admin system prompt).
     * {@code allowWebFetch} lets the CLI fetch URLs (grading/live inspection); shell/file
     * tools stay disabled. {@code modelOverride} picks the model (e.g. "sonnet" for deeper
     * analysis) — blank/null falls back to the configured default ({@code ai.model}).
     */
    public String run(String prompt, boolean allowWebFetch, String modelOverride) {
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("prompt must not be blank");
        }
        String effectiveModel = (modelOverride == null || modelOverride.isBlank()) ? this.model : modelOverride;
        return runClaude(prompt, allowWebFetch, effectiveModel);
    }

    private String runClaude(String fullPrompt, boolean allowWebFetch, String modelToUse) {

        //AI STUFF, COMMENT THIS TO GET AI WORKING
        if (!AI_ENABLED) {
        log.warn("AI service call blocked: AI_ENABLED is false");
        throw new AiUnavailableException("The AI service is currently disabled for demo.");
        }


        String disallowedTools = allowWebFetch ? TOOLS_ALLOW_WEBFETCH : TOOLS_NONE;

        // Native exe + args-as-array + prompt-on-stdin: no shell, so no injection/quoting.
        ProcessBuilder pb = new ProcessBuilder(
                claudeBin, "-p",
                "--model", modelToUse,
                "--effort", effort,
                "--disallowedTools", disallowedTools);
        // Neutral scratch dir so the CLI pulls in no local git/file context.
        pb.directory(new File(System.getProperty("java.io.tmpdir")));

        Process process = null;
        try {
            process = pb.start();

            // Feed the prompt via stdin, then close it so the CLI proceeds.
            try (OutputStream stdin = process.getOutputStream()) {
                stdin.write(fullPrompt.getBytes(StandardCharsets.UTF_8));
            }

            // Drain stdout/stderr on separate threads to avoid pipe-buffer deadlock.
            StringBuilder out = new StringBuilder();
            StringBuilder err = new StringBuilder();
            Thread outReader = drain(process.getInputStream(), out);
            Thread errReader = drain(process.getErrorStream(), err);
            outReader.start();
            errReader.start();

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new AiUnavailableException("The AI request timed out.");
            }
            outReader.join(2000);
            errReader.join(2000);

            if (process.exitValue() != 0) {
                String detail = err.length() > 0 ? err.toString().trim() : "exit code " + process.exitValue();
                log.error("Claude CLI failed: {}", detail);
                throw new AiUnavailableException("The AI service failed: " + detail);
            }
            return out.toString().trim();

        } catch (IOException ex) {
            log.error("Could not launch the Claude CLI ({})", claudeBin, ex);
            throw new AiUnavailableException("The AI service is currently unavailable: " + ex.getMessage());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            if (process != null) {
                process.destroyForcibly();
            }
            throw new AiUnavailableException("The AI request was interrupted.");
        }
    }

    /** A daemon thread that reads a stream fully into the given buffer (UTF-8). */
    private static Thread drain(InputStream stream, StringBuilder sink) {
        Thread t = new Thread(() -> {
            try {
                sink.append(new String(stream.readAllBytes(), StandardCharsets.UTF_8));
            } catch (IOException ignored) {
                // Stream closed (e.g. process destroyed on timeout) — nothing to do.
            }
        });
        t.setDaemon(true);
        return t;
    }

    /**
     * A compact, live snapshot of the portal the assistant can reason over: dashboard
     * counts plus a one-line-per-submission list. Never throws — degrades to a note.
     */
    private String buildPortalContext() {
        try {
            DashboardStatsDto stats = dashboardService.getStats();
            List<SubmissionDto> submissions = submissionService.getAllSubmissions();

            StringBuilder sb = new StringBuilder();
            sb.append("total submissions=").append(stats.totalSubmissions())
              .append(", pending=").append(stats.pendingCount())
              .append(", scored=").append(stats.scoredCount()).append(". Submissions: ");
            for (int i = 0; i < submissions.size(); i++) {
                SubmissionDto s = submissions.get(i);
                if (i > 0) {
                    sb.append(" / ");
                }
                sb.append(clean(s.team()))
                  .append(" (").append(clean(s.hackathon())).append(") ")
                  .append(clean(s.projectTitle()))
                  .append(" status=").append(s.status());
                if (s.score() != null) {
                    sb.append(" score=").append(s.score());
                }
            }
            return sb.toString();
        } catch (Exception ex) {
            log.warn("Could not build portal context for the AI Navigator: {}", ex.getMessage());
            return "(unavailable)";
        }
    }

    private static String clean(String value) {
        return value == null ? "" : value.replace("\n", " ").trim();
    }
}
