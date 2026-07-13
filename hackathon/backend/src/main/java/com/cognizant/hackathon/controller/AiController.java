package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.AiQueryRequest;
import com.cognizant.hackathon.dto.AiResponse;
import com.cognizant.hackathon.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI Navigator endpoint. Admin-only (inherits the global JWT requirement) — the
 * frontend calls it through the authenticated axios client. Delegates to AiService,
 * which proxies to the Node AI server.
 */
@RestController
@RequestMapping("/api/ai")
@Tag(name = "AI Navigator", description = "Proxy to the AI assistant")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @Operation(summary = "Send a prompt to the AI Navigator (proxied to the Node AI server)")
    @PostMapping("/query")
    public AiResponse query(@RequestBody AiQueryRequest request) {
        return aiService.query(request.prompt());
    }
}
