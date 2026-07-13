package com.cognizant.hackathon.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enables Spring's @Async support so message persistence can run off the request
 * thread. Controller methods return {@link java.util.concurrent.CompletableFuture},
 * which Spring MVC processes asynchronously — the servlet thread is released while
 * the write completes, so send latency isn't felt on the request path.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
