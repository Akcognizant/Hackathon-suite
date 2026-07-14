package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.CreateParticipantSubmissionRequest;
import com.cognizant.hackathon.dto.CreateParticipantTeamRequest;
import com.cognizant.hackathon.dto.ParticipantEventDto;
import com.cognizant.hackathon.dto.ParticipantHistoryDto;
import com.cognizant.hackathon.dto.ParticipantMemberDto;
import com.cognizant.hackathon.dto.ParticipantSubmissionDto;
import com.cognizant.hackathon.dto.ParticipantTeamDto;
import com.cognizant.hackathon.entity.AdminUser;
import com.cognizant.hackathon.entity.Hackathon;
import com.cognizant.hackathon.entity.Leaderboard;
import com.cognizant.hackathon.entity.Participant;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.entity.Team;
import com.cognizant.hackathon.entity.enums.SubmissionStatus;
import com.cognizant.hackathon.entity.enums.TeamStatus;
import com.cognizant.hackathon.repository.AdminUserRepository;
import com.cognizant.hackathon.repository.HackathonRepository;
import com.cognizant.hackathon.repository.LeaderboardRepository;
import com.cognizant.hackathon.repository.ParticipantRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import com.cognizant.hackathon.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Participant-facing use cases (browse events, form teams, submit projects, view
 * history) implemented on the admin portal's own entity model. Team membership is
 * expressed as {@link Participant} roster rows keyed by the account's email, so a
 * participant's team automatically appears in the admin's team/roster views.
 */
@Service
@RequiredArgsConstructor
public class ParticipantPortalService {

    private final HackathonRepository hackathonRepository;
    private final TeamRepository teamRepository;
    private final ParticipantRepository participantRepository;
    private final SubmissionRepository submissionRepository;
    private final LeaderboardRepository leaderboardRepository;
    private final AdminUserRepository adminUserRepository;

    // ---- Events ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ParticipantEventDto> listEvents() {
        return hackathonRepository.findAll().stream()
                .map(h -> new ParticipantEventDto(
                        h.getId(), h.getTitle(), h.getDescription(),
                        h.getStartDate(), h.getEndDate(), h.getStatus(),
                        h.getMinTeamSize(), h.getMaxTeamSize(),
                        teamRepository.countByHackathonId(h.getId())))
                .toList();
    }

    // ---- Teams ----------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ParticipantTeamDto> myTeams() {
        String email = currentEmail();
        return myRosterRows(email).stream()
                .map(Participant::getTeam)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .map(this::toTeamDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ParticipantTeamDto> joinableTeams() {
        String email = currentEmail();
        Set<Long> myHackathonIds = myHackathonIds(email);
        Set<Long> myTeamIds = myRosterRows(email).stream()
                .map(p -> p.getTeam() != null ? p.getTeam().getId() : null)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());

        return teamRepository.findAll().stream()
                .filter(t -> t.getHackathon() != null)
                // Exclude teams I'm already in, and teams for hackathons I've already joined.
                .filter(t -> !myTeamIds.contains(t.getId()))
                .filter(t -> !myHackathonIds.contains(t.getHackathon().getId()))
                .map(this::toTeamDto)
                .toList();
    }

    @Transactional
    public ParticipantTeamDto createTeam(CreateParticipantTeamRequest req) {
        AdminUser me = currentAccount();
        Hackathon hackathon = hackathonRepository.findById(req.hackathonId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Hackathon not found"));

        if (teamRepository.findFirstByNameAndHackathonId(req.name().trim(), hackathon.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A team with this name already exists for this hackathon");
        }
        if (myHackathonIds(me.getEmail()).contains(hackathon.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You are already in a team for this hackathon");
        }

        // Resolve the full member set (creator + invited emails), de-duplicated.
        Set<String> memberEmails = new LinkedHashSet<>();
        memberEmails.add(me.getEmail().toLowerCase());
        if (req.members() != null) {
            for (String raw : req.members()) {
                if (raw != null && !raw.isBlank()) {
                    memberEmails.add(raw.trim().toLowerCase());
                }
            }
        }

        String myEmail = me.getEmail().toLowerCase();
        for (String memberEmail : memberEmails) {
            // Added members (other than the creator) must be registered accounts.
            if (!memberEmail.equals(myEmail) && adminUserRepository.findByEmail(memberEmail).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No such user exists: " + memberEmail);
            }
            // Each member must be free for this hackathon.
            if (myHackathonIds(memberEmail).contains(hackathon.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        memberEmail + " is already in a team for this hackathon");
            }
        }

        validateSize(hackathon, memberEmails.size());

        Team team = teamRepository.save(Team.builder()
                .name(req.name().trim())
                .status(TeamStatus.PENDING)
                .hackathon(hackathon)
                .build());

        for (String memberEmail : memberEmails) {
            participantRepository.save(Participant.builder()
                    .name(displayName(memberEmail))
                    .email(memberEmail)
                    .team(team)
                    .build());
        }

        return toTeamDto(team);
    }

    @Transactional
    public ParticipantTeamDto joinTeam(Long teamId) {
        AdminUser me = currentAccount();
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        List<Participant> roster = participantRepository.findByTeamId(team.getId());
        boolean alreadyMember = roster.stream()
                .anyMatch(p -> me.getEmail().equalsIgnoreCase(p.getEmail()));
        if (alreadyMember) {
            return toTeamDto(team); // no-op
        }

        if (team.getHackathon() != null
                && myHackathonIds(me.getEmail()).contains(team.getHackathon().getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You are already in a team for this hackathon");
        }

        Integer max = team.getHackathon() != null ? team.getHackathon().getMaxTeamSize() : null;
        if (max != null && roster.size() >= max) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This team is already full");
        }

        participantRepository.save(Participant.builder()
                .name(displayName(me.getEmail()))
                .email(me.getEmail())
                .team(team)
                .build());

        return toTeamDto(team);
    }

    // ---- Submissions ----------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ParticipantSubmissionDto> mySubmissions() {
        String email = currentEmail();
        List<ParticipantSubmissionDto> out = new ArrayList<>();
        for (Team team : myTeamEntities(email)) {
            for (Submission s : submissionRepository.findByTeamId(team.getId())) {
                out.add(toSubmissionDto(s));
            }
        }
        return out;
    }

    @Transactional
    public ParticipantSubmissionDto submit(CreateParticipantSubmissionRequest req) {
        String email = currentEmail();
        Team team = teamRepository.findById(req.teamId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        boolean isMember = participantRepository.findByTeamId(team.getId()).stream()
                .anyMatch(p -> email.equalsIgnoreCase(p.getEmail()));
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only submit for a team you belong to");
        }

        // Create-or-update: reuse the team's existing submission if there is one.
        Submission submission = submissionRepository.findByTeamId(team.getId()).stream()
                .findFirst()
                .orElseGet(() -> Submission.builder()
                        .team(team)
                        .hackathon(team.getHackathon())
                        .status(SubmissionStatus.PENDING)
                        .build());

        submission.setProjectTitle(req.projectTitle().trim());
        submission.setDescription(req.description() != null ? req.description().trim() : null);
        submission.setRepositoryUrl(req.repositoryUrl().trim());
        if (submission.getHackathon() == null) {
            submission.setHackathon(team.getHackathon());
        }
        if (submission.getStatus() == null) {
            submission.setStatus(SubmissionStatus.PENDING);
        }

        return toSubmissionDto(submissionRepository.save(submission));
    }

    // ---- History --------------------------------------------------------------

    /**
     * Every COMPLETED hackathon, annotated with the participant's outcome. If they
     * were not on a team for an event, it's still listed with participated=false so
     * the history page can show "Did not participate".
     */
    @Transactional(readOnly = true)
    public List<ParticipantHistoryDto> myHistory() {
        String email = currentEmail();

        // My team per hackathon (first if somehow more than one).
        java.util.Map<Long, Team> myTeamByHackathon = new java.util.HashMap<>();
        for (Team t : myTeamEntities(email)) {
            if (t.getHackathon() != null) {
                myTeamByHackathon.putIfAbsent(t.getHackathon().getId(), t);
            }
        }

        List<ParticipantHistoryDto> out = new ArrayList<>();
        for (Hackathon h : hackathonRepository.findAll()) {
            if (!"COMPLETED".equalsIgnoreCase(h.getStatus())) {
                continue;
            }
            Team team = myTeamByHackathon.get(h.getId());
            if (team == null) {
                out.add(new ParticipantHistoryDto(
                        h.getId(), h.getTitle(), h.getStatus(), false,
                        null, null, null, null, null));
                continue;
            }
            Submission submission = submissionRepository.findByTeamId(team.getId()).stream()
                    .findFirst().orElse(null);
            Integer ranking = null;
            Integer score = null;
            for (Leaderboard row : leaderboardRepository.findByEventIdOrderByRankingAsc(h.getId())) {
                if (team.getName() != null && team.getName().equals(row.getTeamName())) {
                    ranking = row.getRanking();
                    score = row.getScore();
                    break;
                }
            }
            out.add(new ParticipantHistoryDto(
                    h.getId(), h.getTitle(), h.getStatus(), true,
                    team.getName(),
                    submission != null ? submission.getProjectTitle() : null,
                    submission != null && submission.getStatus() != null ? submission.getStatus().name() : null,
                    ranking, score));
        }
        return out;
    }

    // ---- Helpers --------------------------------------------------------------

    private ParticipantTeamDto toTeamDto(Team team) {
        List<ParticipantMemberDto> members = participantRepository.findByTeamId(team.getId()).stream()
                .map(p -> new ParticipantMemberDto(
                        p.getName(), p.getEmail(),
                        p.getRole() != null ? p.getRole().name() : null))
                .toList();
        return new ParticipantTeamDto(
                team.getId(),
                team.getName(),
                team.getStatus() != null ? team.getStatus().name() : null,
                team.getHackathon() != null ? team.getHackathon().getId() : null,
                team.getHackathon() != null ? team.getHackathon().getTitle() : null,
                members,
                members.size());
    }

    private ParticipantSubmissionDto toSubmissionDto(Submission s) {
        return new ParticipantSubmissionDto(
                s.getId(),
                s.getProjectTitle(),
                s.getDescription(),
                s.getRepositoryUrl(),
                s.getStatus() != null ? s.getStatus().name() : null,
                s.getScore(),
                s.getAiScore(),
                s.getAiFeedback(),
                s.getTeam() != null ? s.getTeam().getId() : null,
                s.getTeam() != null ? s.getTeam().getName() : null,
                s.getHackathon() != null ? s.getHackathon().getId() : null,
                s.getHackathon() != null ? s.getHackathon().getTitle() : null);
    }

    private void validateSize(Hackathon hackathon, int size) {
        // Only the maximum is enforced eagerly, so a participant can create a team
        // solo and let others join up to the cap. (The minimum is a soft target
        // surfaced in the UI, not a create-time block.)
        Integer max = hackathon.getMaxTeamSize();
        if (max != null && size > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    hackathon.getTitle() + " allows at most " + max + " members per team");
        }
    }

    private List<Participant> myRosterRows(String email) {
        return participantRepository.findAllByEmail(email);
    }

    private List<Team> myTeamEntities(String email) {
        return myRosterRows(email).stream()
                .map(Participant::getTeam)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
    }

    private Set<Long> myHackathonIds(String email) {
        return myRosterRows(email).stream()
                .map(Participant::getTeam)
                .filter(java.util.Objects::nonNull)
                .map(Team::getHackathon)
                .filter(java.util.Objects::nonNull)
                .map(Hackathon::getId)
                .collect(java.util.stream.Collectors.toSet());
    }

    /** Uses the registered account's display name if known, else the email's local part. */
    private String displayName(String email) {
        return adminUserRepository.findByEmail(email)
                .map(AdminUser::getName)
                .filter(n -> n != null && !n.isBlank())
                .orElseGet(() -> {
                    int at = email.indexOf('@');
                    return at > 0 ? email.substring(0, at) : email;
                });
    }

    private AdminUser currentAccount() {
        return adminUserRepository.findByEmail(currentEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }

    private String currentEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return auth.getName();
    }
}
