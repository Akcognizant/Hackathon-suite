package com.cognizant.hackathon.service;

import com.cognizant.hackathon.entity.RubricCriterion;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.repository.RubricCriterionRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Computes global, cross-hackathon team standings so the UI never re-derives rank
 * on the client.
 *
 * <p><b>Why normalize?</b> Each hackathon can define its own rubric, so the maximum
 * achievable score differs between events (e.g. one is out of 100, another out of
 * 50). Ranking teams by their <i>raw</i> score would then be unfair — a team that
 * scored 45/50 (90%) would rank below a team that scored 80/100 (80%). To rank
 * fairly across events we convert every team's raw score to a percentage of its own
 * hackathon's maximum, then rank on that common 0–100 scale.
 *
 * <p><b>Algorithm</b> (per team T, which belongs to exactly one hackathon H):
 * <pre>
 *   maxPoints(H) = sum of maxPoints over H's rubric criteria   (fallback 100 if none)
 *   raw(T)       = best human {@link Submission#getScore()} across T's submissions
 *   percent(T)   = round( raw(T) / maxPoints(H) * 100 ), clamped to [0,100]
 * </pre>
 * Teams are then ranked 1..N by percent descending; ties break by higher raw score,
 * then by team id (stable/deterministic). Teams with no scored submission are absent
 * from the maps (unranked).
 */
@Service
@RequiredArgsConstructor
public class TeamRankingService {

    /** Denominator used when a hackathon has no rubric defined (treat raw as already a %). */
    private static final int DEFAULT_MAX_POINTS = 100;

    private final SubmissionRepository submissionRepository;
    private final RubricCriterionRepository rubricCriterionRepository;

    /** Immutable snapshot of the current standings, keyed by team id. */
    public record Standings(
            Map<Long, Integer> rankByTeam,
            Map<Long, Integer> scoreByTeam,
            Map<Long, Integer> percentByTeam) {

        public Integer rankOf(Long teamId) {
            return rankByTeam.get(teamId);
        }

        /** Raw human score (points), before normalization. */
        public Integer scoreOf(Long teamId) {
            return scoreByTeam.get(teamId);
        }

        /** Normalized score on the common 0–100 scale (% of the hackathon's max). */
        public Integer percentOf(Long teamId) {
            return percentByTeam.get(teamId);
        }
    }

    @Transactional(readOnly = true)
    public Standings compute() {
        // Best raw human score per team, plus the hackathon that best score came from
        // (a team belongs to one hackathon, so any of its submissions would do — we
        // track the best-scoring one's hackathon explicitly for clarity).
        Map<Long, Integer> bestScore = new HashMap<>();
        Map<Long, Long> hackathonByTeam = new HashMap<>();
        for (Submission submission : submissionRepository.findByScoreIsNotNull()) {
            if (submission.getTeam() == null || submission.getScore() == null) {
                continue;
            }
            Long teamId = submission.getTeam().getId();
            Integer previousBest = bestScore.get(teamId);
            if (previousBest == null || submission.getScore() > previousBest) {
                bestScore.put(teamId, submission.getScore());
                if (submission.getHackathon() != null) {
                    hackathonByTeam.put(teamId, submission.getHackathon().getId());
                }
            }
        }

        // Normalize each team's raw score to a percentage of its hackathon's maximum.
        Map<Long, Integer> maxPointsCache = new HashMap<>();
        Map<Long, Integer> percentByTeam = new HashMap<>();
        for (Map.Entry<Long, Integer> entry : bestScore.entrySet()) {
            int raw = entry.getValue();
            int maxPoints = maxPointsFor(hackathonByTeam.get(entry.getKey()), maxPointsCache);
            int percent = (int) Math.round((raw * 100.0) / maxPoints);
            percent = Math.max(0, Math.min(100, percent));
            percentByTeam.put(entry.getKey(), percent);
        }

        // Assign dense positions by percentage descending (1 = highest). Ties break by
        // higher raw score, then lowest team id so the order is fully deterministic.
        Map<Long, Integer> rank = new LinkedHashMap<>();
        int[] position = {1};
        percentByTeam.entrySet().stream()
                .sorted(Comparator
                        .comparingInt((Map.Entry<Long, Integer> e) -> e.getValue()).reversed()
                        .thenComparing(e -> bestScore.get(e.getKey()), Comparator.reverseOrder())
                        .thenComparing(Map.Entry::getKey))
                .forEach(entry -> rank.put(entry.getKey(), position[0]++));

        return new Standings(rank, bestScore, percentByTeam);
    }

    /** Sum of a hackathon's rubric max points (cached); {@value #DEFAULT_MAX_POINTS} if none. */
    private int maxPointsFor(Long hackathonId, Map<Long, Integer> cache) {
        if (hackathonId == null) {
            return DEFAULT_MAX_POINTS;
        }
        Integer cached = cache.get(hackathonId);
        if (cached != null) {
            return cached;
        }
        int sum = rubricCriterionRepository.findByHackathonId(hackathonId).stream()
                .mapToInt(RubricCriterion::getMaxPoints)
                .sum();
        int maxPoints = sum > 0 ? sum : DEFAULT_MAX_POINTS;
        cache.put(hackathonId, maxPoints);
        return maxPoints;
    }
}
