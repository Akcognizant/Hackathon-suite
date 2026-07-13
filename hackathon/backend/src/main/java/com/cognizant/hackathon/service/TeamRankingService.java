package com.cognizant.hackathon.service;

import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Computes global team standings so the UI never re-derives rank on the client.
 * A team's score is the best human {@link Submission#getScore()} across its
 * submissions; teams are ranked 1..N by that score descending. Teams with no
 * scored submission are simply absent from the maps (unranked).
 */
@Service
@RequiredArgsConstructor
public class TeamRankingService {

    private final SubmissionRepository submissionRepository;

    /** Immutable snapshot of the current standings, keyed by team id. */
    public record Standings(Map<Long, Integer> rankByTeam, Map<Long, Integer> scoreByTeam) {
        public Integer rankOf(Long teamId) {
            return rankByTeam.get(teamId);
        }

        public Integer scoreOf(Long teamId) {
            return scoreByTeam.get(teamId);
        }
    }

    @Transactional(readOnly = true)
    public Standings compute() {
        // Best human score per team.
        Map<Long, Integer> bestScore = new HashMap<>();
        for (Submission submission : submissionRepository.findByScoreIsNotNull()) {
            if (submission.getTeam() == null || submission.getScore() == null) {
                continue;
            }
            bestScore.merge(submission.getTeam().getId(), submission.getScore(), Math::max);
        }

        // Assign dense positions by score descending (1 = highest).
        Map<Long, Integer> rank = new LinkedHashMap<>();
        int[] position = {1};
        bestScore.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                .forEach(entry -> rank.put(entry.getKey(), position[0]++));

        return new Standings(rank, bestScore);
    }
}
