package com.cognizant.hackathon.config;

import com.cognizant.hackathon.entity.AdminUser;
import com.cognizant.hackathon.entity.Hackathon;
import com.cognizant.hackathon.entity.Participant;
import com.cognizant.hackathon.entity.RubricCriterion;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.entity.Team;
import com.cognizant.hackathon.entity.enums.AdminRole;
import com.cognizant.hackathon.entity.enums.ParticipantRole;
import com.cognizant.hackathon.entity.enums.SubmissionStatus;
import com.cognizant.hackathon.entity.enums.TeamStatus;
import com.cognizant.hackathon.repository.AdminUserRepository;
import com.cognizant.hackathon.repository.HackathonRepository;
import com.cognizant.hackathon.repository.ParticipantRepository;
import com.cognizant.hackathon.repository.RubricCriterionRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import com.cognizant.hackathon.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Seeds the (persistent) PostgreSQL database on startup so the running app mirrors
 * the frontend's demo data (teams/submissions/rubrics) and ships with usable admin
 * logins. Idempotent: only seeds empty tables — because the DB persists across
 * restarts, domain seeding is guarded by a {@code count() == 0} check so a restart
 * never duplicates data or floods the activity feed.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private static final String DEMO_REPO = "https://github.com/cognizant-hackathon-demo/repo";

    // Per-hackathon submission secrets seeded for the demo events.
    private static final String SECRET_AI = "ai-sprint-2026";
    private static final String SECRET_FINTECH = "fintech-2026";
    private static final String SECRET_CLOUD = "cloud-native-2026";

    private final HackathonRepository hackathonRepository;
    private final TeamRepository teamRepository;
    private final ParticipantRepository participantRepository;
    private final SubmissionRepository submissionRepository;
    private final RubricCriterionRepository rubricCriterionRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // IMPORTANT: all seeding goes through repositories directly — NEVER through
        // the event-publishing services (HackathonService, SubmissionService, etc.).
        // Bootstrap data is not a user action, so it must not emit activity events.
        // Combined with the idempotency guards below, a restart never floods the feed.
       
     
        // Demo/domain seeding is DISABLED — admins create their own real hackathons,
        // and re-adding the sample AI/FinTech/Cloud events on every startup was just
        // clutter that reappeared after being deleted. The seedDomainData()/
        // seedCriteria()/ensureSubmissionSecrets() helpers are kept below for reference;
        // re-enable those calls only if you want the demo data back.

        // Only bootstrap the admin/judge login accounts if the accounts table is empty
        // (so a brand-new DB is still usable). Existing accounts are left untouched.
        if (adminUserRepository.count() == 0) {
            seedAdmins();
        }
    }

    /** Sets a submission secret on each demo hackathon that currently lacks one. */
    private void ensureSubmissionSecrets() {
        setSecretIfMissing("AI Innovation Sprint", SECRET_AI);
        setSecretIfMissing("FinTech Build Weekend", SECRET_FINTECH);
        setSecretIfMissing("Cloud Native Challenge", SECRET_CLOUD);
    }

    private void setSecretIfMissing(String title, String secret) {
        hackathonRepository.findFirstByTitle(title).ifPresent(hackathon -> {
            if (hackathon.getSubmissionSecret() == null || hackathon.getSubmissionSecret().isBlank()) {
                hackathon.setSubmissionSecret(secret);
                hackathonRepository.save(hackathon);
            }
        });
    }

    private void seedDomainData() {
        Hackathon aiSprint = ensureHackathon(
                "AI Innovation Sprint",
                "AI/ML for cloud cost optimization & ops tooling",
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3),
                "ACTIVE",
                SECRET_AI,
                2, 5);

        Hackathon finTech = ensureHackathon(
                "FinTech Build Weekend",
                "Payment & fraud-detection prototyping",
                LocalDate.now().plusDays(7),
                LocalDate.now().plusDays(9),
                "UPCOMING",
                SECRET_FINTECH,
                2, 4);

        Hackathon cloudNative = ensureHackathon(
                "Cloud Native Challenge",
                "Legacy to Kubernetes-native microservices migration task.",
                LocalDate.now().minusDays(5),
                LocalDate.now().minusDays(2),
                "COMPLETED",
                SECRET_CLOUD,
                2, 4);

        // Evaluation criteria are seeded separately by seedCriteria() so they're
        // also backfilled onto an already-populated database.

        // Teams + their two members + project submissions. ensureTeam() is idempotent
        // (skips any team whose name already exists), so these are safe to re-run.
        ensureTeam("Neural Ninjas", aiSprint, "CostGuard — AI Cloud Spend Optimizer", SubmissionStatus.PENDING,
                "Aarav Sharma", ParticipantRole.BACKEND, "Priya Nair", ParticipantRole.AI);
        ensureTeam("Pixel Pioneers", finTech, "PayFlow — Instant Settlement Dashboard", SubmissionStatus.PENDING,
                "Rohan Mehta", ParticipantRole.FRONTEND, "Sneha Iyer", ParticipantRole.BACKEND);
        ensureTeam("Cloud Crusaders", cloudNative, "K8s Migrator — Legacy to Microservices", SubmissionStatus.APPROVED,
                "Vikram Rao", ParticipantRole.BACKEND, "Ananya Das", ParticipantRole.FRONTEND);
        ensureTeam("Data Dynamos", aiSprint, "InsightLens — Realtime Anomaly Detection", SubmissionStatus.REJECTED,
                "Karthik Menon", ParticipantRole.AI, "Divya Pillai", ParticipantRole.FRONTEND);
        ensureTeam("Quantum Quokkas", finTech, "LedgerLink — Cross-Bank Reconciliation", SubmissionStatus.PENDING,
                "Aditya Verma", ParticipantRole.FRONTEND, "Meera Krishnan", ParticipantRole.BACKEND);

        ensureTeam("Cyber Sentinels", aiSprint, "BotShield — AI Phishing Detection", SubmissionStatus.PENDING,
                "Arjun Nair", ParticipantRole.AI, "Ishita Das", ParticipantRole.BACKEND);

        ensureTeam("Legacy Breakers", cloudNative, "Monolith2Micro — Automated Refactoring", SubmissionStatus.APPROVED,
                "Ravi Kumar", ParticipantRole.BACKEND, "Neha Gupta", ParticipantRole.FRONTEND);
    }

    /**
     * Returns the hackathon with this title if it already exists, otherwise creates
     * it. Keyed by title so re-running the seeder never produces duplicate demo
     * events and never overwrites an admin-created hackathon of the same name.
     */
    private Hackathon ensureHackathon(String title, String description, LocalDate startDate,
                                      LocalDate endDate, String status, String secret,
                                      Integer minTeamSize, Integer maxTeamSize) {
        return hackathonRepository.findFirstByTitle(title)
                .orElseGet(() -> hackathonRepository.save(new Hackathon(
                        null, title, description, startDate, endDate, status, secret,
                        minTeamSize, maxTeamSize)));
    }

    private void seedRubric(Hackathon hackathon, Object... nameMaxPairs) {
        for (int i = 0; i < nameMaxPairs.length; i += 2) {
            String name = (String) nameMaxPairs[i];
            int max = (Integer) nameMaxPairs[i + 1];
            rubricCriterionRepository.save(RubricCriterion.builder()
                    .name(name)
                    .maxPoints(max)
                    .hackathon(hackathon)
                    .build());
        }
    }

    /** Seeds default evaluation criteria for the demo hackathons (idempotent). */
    private void seedCriteria() {
        ensureCriteria("AI Innovation Sprint", "Model Accuracy", 30, "Innovation", 30, "Code Quality", 40);
        ensureCriteria("Cloud Native Challenge", "Scalability", 40, "Security", 30, "Implementation", 30);
        ensureCriteria("FinTech Build Weekend",
                "Innovation", 25, "Technical Complexity", 25, "UI/UX", 25, "Business Value", 25);
    }

    /** Adds the given criteria to the named hackathon only if it currently has none. */
    private void ensureCriteria(String hackathonTitle, Object... nameMaxPairs) {
        hackathonRepository.findAll().stream()
                .filter(h -> hackathonTitle.equals(h.getTitle()))
                .findFirst()
                .ifPresent(hackathon -> {
                    if (rubricCriterionRepository.findByHackathonId(hackathon.getId()).isEmpty()) {
                        seedRubric(hackathon, nameMaxPairs);
                    }
                });
    }

    /**
     * Idempotent wrapper around {@link #seedTeam}: creates the team (plus its two
     * members and submission) only if no team with this name already exists —
     * otherwise it's a no-op. Safe to call on every startup without duplicating data.
     */
    private void ensureTeam(String teamName, Hackathon hackathon, String projectTitle, SubmissionStatus status,
                            String member1, ParticipantRole role1, String member2, ParticipantRole role2) {
        if (teamRepository.findFirstByName(teamName).isPresent()) {
            return; // already seeded — skip to avoid duplicates
        }
        seedTeam(teamName, hackathon, projectTitle, status, member1, role1, member2, role2);
    }

    private void seedTeam(String teamName, Hackathon hackathon, String projectTitle, SubmissionStatus status,
                          String member1, ParticipantRole role1, String member2, ParticipantRole role2) {
        Team team = teamRepository.save(Team.builder()
                .name(teamName)
                .status(TeamStatus.valueOf(status.name()))
                .hackathon(hackathon)
                .build());

        participantRepository.save(Participant.builder()
                .name(member1)
                .email(toEmail(member1))
                .role(role1)
                .team(team)
                .build());
        participantRepository.save(Participant.builder()
                .name(member2)
                .email(toEmail(member2))
                .role(role2)
                .team(team)
                .build());

        submissionRepository.save(Submission.builder()
                .projectTitle(projectTitle)
                .repositoryUrl(DEMO_REPO)
                .status(status)
                .score(null)
                .team(team)
                .hackathon(hackathon)
                .build());
    }

    private String toEmail(String fullName) {
        return fullName.trim().toLowerCase().replace(" ", ".") + "@cognizant.com";
    }

    private void seedAdmins() {
        adminUserRepository.save(AdminUser.builder()
                .email("deon.jose@cognizant.com")
                .password(passwordEncoder.encode("Password@123"))
                .role(AdminRole.ADMIN)
                .build());
        adminUserRepository.save(AdminUser.builder()
                .email("admin@cognizant.com")
                .password(passwordEncoder.encode("admin123"))
                .role(AdminRole.ADMIN)
                .build());
        adminUserRepository.save(AdminUser.builder()
                .email("judge@cognizant.com")
                .password(passwordEncoder.encode("judge123"))
                .role(AdminRole.JUDGE)
                .build());
    }

    /** Creates a PARTICIPANT account if one with this email does not already exist. */
    private void ensureParticipant(String email, String name, String rawPassword) {
        if (adminUserRepository.findByEmail(email).isPresent()) {
            return;
        }
        adminUserRepository.save(AdminUser.builder()
                .email(email)
                .name(name)
                .password(passwordEncoder.encode(rawPassword))
                .role(AdminRole.PARTICIPANT)
                .build());
    }
}
