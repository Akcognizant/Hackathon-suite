package com.cognizant.hackathon.config;

import com.cognizant.hackathon.security.JwtAuthenticationFilter;
import com.cognizant.hackathon.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        // The SPA itself is public (Spring serves it): static assets +
                        // client-side routes. The DATA APIs below stay JWT-protected, and
                        // React still gates admin *pages* on the client.
                        .requestMatchers(HttpMethod.GET,
                                "/", "/index.html", "/favicon.ico", "/vite.svg",
                                "/assets/**", "/*.png", "/*.svg", "/*.ico", "/*.json", "/*.txt",
                                "/login", "/register", "/sso", "/submit", "/dashboard", "/participants", "/scores",
                                "/leaderboard", "/teams", "/submissions", "/hackathons", "/hackathons/**",
                                "/portal", "/portal/**")
                        .permitAll()
                        // Public team submission intake — not behind JWT; guarded
                        // instead by the X-Team-Secret header (TeamSecretValidator).
                        .requestMatchers(HttpMethod.POST, "/submissions").permitAll()
                        // Public, secret-free hackathon list for the submission form dropdown.
                        .requestMatchers(HttpMethod.GET, "/submissions/hackathons").permitAll()
                        // --- Role-based access (order matters: specific rules first) ---
                        // Read-only: JUDGE + ADMIN may GET hackathon lists/details/export,
                        // read per-hackathon criteria, and list participants (so those tables
                        // load). Writes on these paths still fall through to ADMIN-only below.
                        .requestMatchers(HttpMethod.GET,
                                "/admin/events", "/admin/events/**",
                                "/admin/hackathons/**",
                                "/admin/participants", "/admin/participants/**",
                                "/admin/teams", "/admin/teams/**",
                                // Read-only activity feed is visible to judges too;
                                // DELETE /admin/activities (Clear All) stays ADMIN-only below.
                                "/admin/activities").hasAnyRole("ADMIN", "JUDGE")
                        // Submission review + scoring: JUDGE + ADMIN (all methods).
                        .requestMatchers(
                                "/admin/submissions", "/admin/submissions/**",
                                "/admin/scores", "/admin/scores/**").hasAnyRole("ADMIN", "JUDGE")
                        // Individual talent evaluation is part of the judge's grading flow.
                        .requestMatchers(HttpMethod.POST, "/admin/participants/*/evaluate")
                        .hasAnyRole("ADMIN", "JUDGE")
                        // Broadcasting announcements to all participants is ADMIN-only.
                        .requestMatchers(HttpMethod.POST, "/admin/messages/announcement")
                        .hasRole("ADMIN")
                        // Direct messaging between admins and judges (all methods).
                        .requestMatchers("/admin/messages", "/admin/messages/**")
                        .hasAnyRole("ADMIN", "JUDGE")
                        // Everything else under /admin — including POST/PUT/DELETE on hackathons
                        // and all criteria writes — is ADMIN-only. Non-admins get 403.
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        // Participant portal: self-registered participants only.
                        .requestMatchers("/participant/**").hasRole("PARTICIPANT")
                        .anyRequest().authenticated())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
