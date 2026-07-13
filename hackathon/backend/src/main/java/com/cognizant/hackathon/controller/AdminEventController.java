package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.PageResponse;
import com.cognizant.hackathon.entity.Hackathon;
import com.cognizant.hackathon.service.HackathonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.SortDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/admin/events")
@Tag(name = "Events", description = "Manage hackathon events")
@RequiredArgsConstructor
public class AdminEventController {

    private static final String CSV_HEADER = "Title,Description,Start Date,End Date,Status";

    private final HackathonService hackathonService;

    @Operation(summary = "List events (paginated, sortable, filterable by search/status)")
    @GetMapping
    public PageResponse<Hackathon> getAllEvents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "startDate", direction = Sort.Direction.ASC) Pageable pageable) {
        return PageResponse.from(hackathonService.getHackathons(search, status, pageable));
    }

    @Operation(summary = "Export events as CSV (respects the same search/status/sort)")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportEvents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @SortDefault(sort = "startDate", direction = Sort.Direction.ASC) Sort sort) {
        byte[] csv = toCsv(hackathonService.findForExport(search, status, sort))
                .getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"hackathons.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @Operation(summary = "Get an event by id")
    @GetMapping("/{id}")
    public Hackathon getEventById(@PathVariable Long id) {
        return hackathonService.getHackathonById(id);
    }

    @Operation(summary = "Create a new event")
    @PostMapping
    public ResponseEntity<Hackathon> createEvent(@Valid @RequestBody Hackathon event) {
        Hackathon created = hackathonService.createHackathon(event);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @Operation(summary = "Update an existing event")
    @PutMapping("/{id}")
    public Hackathon updateEvent(@PathVariable Long id, @Valid @RequestBody Hackathon event) {
        return hackathonService.updateHackathon(id, event);
    }

    @Operation(summary = "Delete an event")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        hackathonService.deleteHackathon(id);
        return ResponseEntity.noContent().build();
    }

    /** Build an RFC-4180-ish CSV (quote fields containing comma/quote/newline). */
    private static String toCsv(List<Hackathon> rows) {
        StringBuilder sb = new StringBuilder(CSV_HEADER).append('\n');
        for (Hackathon h : rows) {
            sb.append(csv(h.getTitle())).append(',')
              .append(csv(h.getDescription())).append(',')
              .append(csv(h.getStartDate())).append(',')
              .append(csv(h.getEndDate())).append(',')
              .append(csv(h.getStatus())).append('\n');
        }
        return sb.toString();
    }

    private static String csv(Object value) {
        if (value == null) {
            return "";
        }
        String s = value.toString();
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return '"' + s.replace("\"", "\"\"") + '"';
        }
        return s;
    }
}
