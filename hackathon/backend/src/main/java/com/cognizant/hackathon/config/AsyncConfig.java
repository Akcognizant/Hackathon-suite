package com.cognizant.hackathon.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables Spring's @Async support so message persistence can run off the request
 * thread. Controller methods return {@link java.util.concurrent.CompletableFuture},
 * which Spring MVC processes asynchronously — the servlet thread is released while
 * the write completes, so send latency isn't felt on the request path.
 *
 * <p>Also enables @Scheduled so HackathonService can periodically refresh event
 * statuses (UPCOMING/ACTIVE/COMPLETED) as their dates pass.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {
}
