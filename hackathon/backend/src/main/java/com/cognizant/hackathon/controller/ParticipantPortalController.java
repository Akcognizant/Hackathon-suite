package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.AddTeamMemberRequest;
import com.cognizant.hackathon.dto.CreateParticipantSubmissionRequest;
import com.cognizant.hackathon.dto.CreateParticipantTeamRequest;
import com.cognizant.hackathon.dto.ParticipantEventDto;
import com.cognizant.hackathon.dto.ParticipantHistoryDto;
import com.cognizant.hackathon.dto.ParticipantSubmissionDto;
import com.cognizant.hackathon.dto.ParticipantTeamDto;
import com.cognizant.hackathon.service.ParticipantPortalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Participant-facing API (role PARTICIPANT). Namespaced under /participant to keep
 * it clear of the admin (/admin/**) and public (/submissions) surfaces.
 */
@RestController
@RequestMapping("/participant")
@RequiredArgsConstructor
public class ParticipantPortalController {

    private final ParticipantPortalService service;

    @GetMapping("/events")
    public List<ParticipantEventDto> events() {
        return service.listEvents();
    }

    @GetMapping("/teams/mine")
    public List<ParticipantTeamDto> myTeams() {
        return service.myTeams();
    }

    @GetMapping("/teams/joinable")
    public List<ParticipantTeamDto> joinableTeams() {
        return service.joinableTeams();
    }

    @PostMapping("/teams")
    @ResponseStatus(HttpStatus.CREATED)
    public ParticipantTeamDto createTeam(@Valid @RequestBody CreateParticipantTeamRequest request) {
        return service.createTeam(request);
    }

    @PostMapping("/teams/{id}/join")
    public ParticipantTeamDto joinTeam(@PathVariable Long id) {
        return service.joinTeam(id);
    }

    @PostMapping("/teams/{id}/members")
    public ParticipantTeamDto addMember(@PathVariable Long id,
                                        @Valid @RequestBody AddTeamMemberRequest request) {
        return service.addMember(id, request.email());
    }

    @DeleteMapping("/teams/{id}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leaveTeam(@PathVariable Long id) {
        service.leaveTeam(id);
    }

    @GetMapping("/submissions/me")
    public List<ParticipantSubmissionDto> mySubmissions() {
        return service.mySubmissions();
    }

    @PostMapping("/submissions")
    public ParticipantSubmissionDto submit(@Valid @RequestBody CreateParticipantSubmissionRequest request) {
        return service.submit(request);
    }

    @GetMapping("/history")
    public List<ParticipantHistoryDto> history() {
        return service.myHistory();
    }
}
