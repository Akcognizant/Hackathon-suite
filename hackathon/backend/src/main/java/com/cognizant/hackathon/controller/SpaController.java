package com.cognizant.hackathon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the React single-page app for its client-side routes. Any GET to a known
 * front-end route is forwarded to {@code /index.html} (served from static/), so deep
 * links and browser refreshes work instead of 404-ing.
 *
 * <p>API paths are deliberately NOT listed here, so they keep hitting their own
 * handlers: {@code /api/**}, {@code /admin/**}, {@code POST /submissions},
 * {@code GET /submissions/hackathons}, {@code /v3/**}, {@code /swagger-ui/**}.
 */
@Controller
public class SpaController {

    @GetMapping({
            "/",
            "/login",
            "/register",
            "/sso",
            "/submit",
            "/dashboard",
            "/participants",
            "/scores",
            "/leaderboard",
            "/teams",
            "/submissions",
            "/hackathons",
            "/hackathons/**",
            "/portal",
            "/portal/**"
    })
    public String forwardToSpa() {
        return "forward:/index.html";
    }
}
