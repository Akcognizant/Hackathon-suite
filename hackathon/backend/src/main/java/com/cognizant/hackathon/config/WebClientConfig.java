package com.cognizant.hackathon.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Explicitly defines a {@link WebClient.Builder} bean.
 *
 * <p>This is a servlet/MVC application that pulls in WebFlux solely for
 * {@code WebClient} (used by {@link com.cognizant.hackathon.service.SubmissionAiService}).
 * Rather than depend on Boot's reactive auto-configuration registering the builder,
 * we provide it here so the bean is always available for injection.
 *
 * <p>Prototype-scoped to mirror Spring Boot's own definition: a {@code WebClient.Builder}
 * is mutable, so each injection point gets its own copy and can't clobber another's config.
 */
@Configuration
public class WebClientConfig {

    @Bean
    @Scope("prototype")
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
