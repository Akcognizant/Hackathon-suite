package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.LeaderboardEntryDto;
import com.cognizant.hackathon.entity.Leaderboard;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.HackathonRepository;
import com.cognizant.hackathon.repository.LeaderboardRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final SubmissionRepository submissionRepository;
    private final LeaderboardRepository leaderboardRepository;
    private final HackathonRepository hackathonRepository;

    /**
     * Rebuilds the persisted leaderboard for an event: clears the old rows, ranks
     * every scored submission in the event by score descending, and saves them.
     */
    @Transactional
    public void recompute(Long eventId) {
        leaderboardRepository.deleteByEventId(eventId);

        List<Submission> ranked = submissionRepository.findByHackathonId(eventId).stream()
                .filter(submission -> submission.getScore() != null)
                .sorted(Comparator.comparingInt(Submission::getScore).reversed())
                .toList();

        List<Leaderboard> rows = new ArrayList<>();
        int position = 1;
        for (Submission submission : ranked) {
            rows.add(Leaderboard.builder()
                    .eventId(eventId)
                    .teamName(submission.getTeam() != null ? submission.getTeam().getName() : null)
                    .projectTitle(submission.getProjectTitle())
                    .score(submission.getScore())
                    .ranking(position++)
                    .build());
        }
        leaderboardRepository.saveAll(rows);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard(Long eventId) {
        if (!hackathonRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found with id: " + eventId);
        }
        return leaderboardRepository.findByEventIdOrderByRankingAsc(eventId).stream()
                .map(row -> new LeaderboardEntryDto(
                        row.getRanking(),
                        row.getTeamName(),
                        row.getProjectTitle(),
                        row.getScore()))
                .toList();
    }
}
