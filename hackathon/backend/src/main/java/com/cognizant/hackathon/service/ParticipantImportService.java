package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.ImportResult;
import com.cognizant.hackathon.dto.ParticipantCsvRecord;
import com.cognizant.hackathon.entity.Hackathon;
import com.cognizant.hackathon.entity.Participant;
import com.cognizant.hackathon.entity.Team;
import com.cognizant.hackathon.entity.enums.ParticipantRole;
import com.cognizant.hackathon.entity.enums.TeamStatus;
import com.cognizant.hackathon.event.ParticipantsImportedEvent;
import com.cognizant.hackathon.event.TeamRegisteredEvent;
import com.cognizant.hackathon.repository.HackathonRepository;
import com.cognizant.hackathon.repository.ParticipantRepository;
import com.cognizant.hackathon.repository.TeamRepository;
import com.opencsv.bean.CsvToBeanBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Secure CSV batch-import pipeline for participants.
 *
 * <p>The whole import runs in a single transaction: any validation failure
 * (missing field, malformed email, or a duplicate email within the file) aborts
 * the entire batch via an exception, so the database is never left half-updated.
 * For each valid row the participant is upserted by email — updated if it already
 * exists, created otherwise — and its team is resolved (or created) by name.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ParticipantImportService {

    private final ParticipantRepository participantRepository;
    private final TeamRepository teamRepository;
    private final HackathonRepository hackathonRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ImportResult importParticipants(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("A non-empty CSV file is required");
        }

        List<ParticipantCsvRecord> rows = parse(file);
        log.info("Parsed {} row(s) from CSV '{}'", rows.size(), file.getOriginalFilename());

        Set<String> emailsInFile = new HashSet<>();
        int created = 0;
        int updated = 0;
        int lineNumber = 1; // line 1 is the header

        for (ParticipantCsvRecord row : rows) {
            lineNumber++;

            String name = trimToNull(row.getName());
            String email = trimToNull(row.getEmail());
            String teamName = trimToNull(row.getTeamName());
            String hackathonName = trimToNull(row.getHackathonName());

            // --- Validation (any failure rolls back the whole transaction) ---
            if (name == null || email == null || teamName == null) {
                throw new IllegalArgumentException(
                        "Row " + lineNumber + ": Name, Email and TeamName are all required");
            }
            email = email.toLowerCase();
            if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
                throw new IllegalArgumentException(
                        "Row " + lineNumber + ": invalid email address '" + email + "'");
            }
            if (!emailsInFile.add(email)) {
                throw new IllegalArgumentException(
                        "Row " + lineNumber + ": duplicate email '" + email + "' within the file");
            }

            // Role is optional, but if present it must be a valid enum value.
            ParticipantRole role = parseRole(row.getRole(), lineNumber);

            // --- Resolve the hackathon by name (when the column is provided) ---
            Hackathon hackathon = null;
            if (hackathonName != null) {
                hackathon = hackathonRepository.findFirstByTitle(hackathonName).orElse(null);
                if (hackathon == null) {
                    throw new IllegalArgumentException(
                            "Row " + lineNumber + ": hackathon '" + hackathonName + "' not found");
                }
            }

            // --- Resolve (or create) the team by name, linking it to the hackathon ---
            Team team = teamRepository.findFirstByName(teamName).orElse(null);
            if (team == null) {
                log.info("Team '{}' not found — creating it as part of the import", teamName);
                team = teamRepository.save(Team.builder()
                        .name(teamName)
                        .status(TeamStatus.PENDING)
                        .hackathon(hackathon)
                        .build());
                eventPublisher.publishEvent(new TeamRegisteredEvent(team.getId(), team.getName()));
            } else if (team.getHackathon() == null && hackathon != null) {
                // Backfill the hackathon link for a pre-existing team that lacked one.
                team.setHackathon(hackathon);
                teamRepository.save(team);
            }

            // --- Upsert the participant by email ---
            Participant participant = participantRepository.findByEmail(email).orElse(null);
            if (participant == null) {
                participant = new Participant();
                participant.setEmail(email);
                created++;
            } else {
                updated++;
            }
            participant.setName(name);
            participant.setRole(role);
            participant.setTeam(team);
            participantRepository.save(participant);
        }

        log.info("CSV import committed: {} processed, {} created, {} updated", rows.size(), created, updated);
        eventPublisher.publishEvent(new ParticipantsImportedEvent(rows.size(), created, updated));
        return new ImportResult(rows.size(), created, updated);
    }

    /** Parse the upload into typed records, translating any parser failure into a 400-level error. */
    private List<ParticipantCsvRecord> parse(MultipartFile file) {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            return new CsvToBeanBuilder<ParticipantCsvRecord>(reader)
                    .withType(ParticipantCsvRecord.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .withIgnoreEmptyLine(true)
                    .build()
                    .parse();
        } catch (IOException e) {
            log.error("Unable to read uploaded CSV '{}'", file.getOriginalFilename(), e);
            throw new IllegalArgumentException("Unable to read the uploaded file", e);
        } catch (RuntimeException e) {
            log.error("Failed to parse CSV '{}': {}", file.getOriginalFilename(), e.getMessage());
            throw new IllegalArgumentException("Malformed CSV: " + e.getMessage(), e);
        }
    }

    /** Parse a role cell into the enum; blank -> null, invalid -> a clear row error. */
    private static ParticipantRole parseRole(String value, int lineNumber) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            return null;
        }
        try {
            return ParticipantRole.valueOf(trimmed.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Row " + lineNumber + ": invalid role '" + value + "' (expected one of FRONTEND, BACKEND, AI)");
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
