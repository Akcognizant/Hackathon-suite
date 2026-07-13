package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.EvaluateParticipantRequest;
import com.cognizant.hackathon.dto.ImportResult;
import com.cognizant.hackathon.dto.PageResponse;
import com.cognizant.hackathon.dto.ParticipantDto;
import com.cognizant.hackathon.service.ParticipantImportService;
import com.cognizant.hackathon.service.ParticipantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.SortDefault;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/admin/participants")
@Tag(name = "Participants", description = "Registered hackathon participants")
@RequiredArgsConstructor
public class ParticipantController {

    private final ParticipantService participantService;
    private final ParticipantImportService participantImportService;

    @Operation(summary = "List all participants (sortable; sort fields are whitelisted)")
    @GetMapping
    public List<ParticipantDto> getAllParticipants(
            @SortDefault(sort = "name", direction = Sort.Direction.ASC) Sort sort) {
        return participantService.getAllParticipants(sort);
    }

    @Operation(summary = "List participants (paginated, sortable, filter by role + skill/evaluation)")
    @GetMapping("/page")
    public PageResponse<ParticipantDto> getParticipantsPage(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String evaluation,
            @PageableDefault(size = 10, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return participantService.getParticipantsPage(search, role, evaluation, pageable);
    }

    @Operation(summary = "Submit an individual talent evaluation (technical score + contribution)")
    @PostMapping("/{id}/evaluate")
    public ParticipantDto evaluateParticipant(
            @PathVariable Long id,
            @Valid @RequestBody EvaluateParticipantRequest request) {
        return participantService.evaluateParticipant(id, request);
    }

    @Operation(summary = "Bulk-import participants from a CSV file (columns: Name, Email, TeamName)")
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportResult importParticipants(@RequestParam("file") MultipartFile file) {
        return participantImportService.importParticipants(file);
    }
}
