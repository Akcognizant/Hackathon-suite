package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.LeaderboardEntryDto;
import com.cognizant.hackathon.entity.Leaderboard;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.entity.Team;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.HackathonRepository;
import com.cognizant.hackathon.repository.LeaderboardRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

    @Mock
    private SubmissionRepository submissionRepository;
    @Mock
    private LeaderboardRepository leaderboardRepository;
    @Mock
    private HackathonRepository hackathonRepository;

    @InjectMocks
    private LeaderboardService leaderboardService;

    @Captor
    private ArgumentCaptor<List<Leaderboard>> rowsCaptor;

    private Submission scored(String team, String project, Integer score) {
        return Submission.builder()
                .team(Team.builder().name(team).build())
                .projectTitle(project)
                .score(score)
                .build();
    }

    @Test
    void recompute_ranksScoredSubmissionsByScoreDescending() {
        when(submissionRepository.findByHackathonId(1L)).thenReturn(List.of(
                scored("Alpha", "PA", 85),
                scored("Bravo", "PB", 92),
                scored("Charlie", "PC", 70)));

        leaderboardService.recompute(1L);

        // Old rows for the event are cleared before rebuilding.
        verify(leaderboardRepository).deleteByEventId(1L);

        verify(leaderboardRepository).saveAll(rowsCaptor.capture());
        List<Leaderboard> rows = rowsCaptor.getValue();
        assertEquals(3, rows.size());

        assertEquals("Bravo", rows.get(0).getTeamName());
        assertEquals(92, rows.get(0).getScore());
        assertEquals(1, rows.get(0).getRanking());

        assertEquals("Alpha", rows.get(1).getTeamName());
        assertEquals(2, rows.get(1).getRanking());

        assertEquals("Charlie", rows.get(2).getTeamName());
        assertEquals(3, rows.get(2).getRanking());
    }

    @Test
    void recompute_excludesUnscoredSubmissions() {
        when(submissionRepository.findByHackathonId(1L)).thenReturn(List.of(
                scored("Alpha", "PA", 50),
                scored("Bravo", "PB", null)));

        leaderboardService.recompute(1L);

        verify(leaderboardRepository).saveAll(rowsCaptor.capture());
        List<Leaderboard> rows = rowsCaptor.getValue();
        assertEquals(1, rows.size());
        assertEquals("Alpha", rows.get(0).getTeamName());
        assertEquals(1, rows.get(0).getRanking());
    }

    @Test
    void getLeaderboard_returnsRowsMappedInRankOrder() {
        when(hackathonRepository.existsById(1L)).thenReturn(true);
        when(leaderboardRepository.findByEventIdOrderByRankingAsc(1L)).thenReturn(List.of(
                Leaderboard.builder().ranking(1).teamName("Bravo").projectTitle("PB").score(92).build(),
                Leaderboard.builder().ranking(2).teamName("Alpha").projectTitle("PA").score(85).build()));

        List<LeaderboardEntryDto> result = leaderboardService.getLeaderboard(1L);

        assertEquals(2, result.size());
        assertEquals(1, result.get(0).rank());
        assertEquals("Bravo", result.get(0).team());
        assertEquals(92, result.get(0).score());
        assertEquals("Alpha", result.get(1).team());
    }

    @Test
    void getLeaderboard_throwsWhenEventDoesNotExist() {
        when(hackathonRepository.existsById(404L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
                () -> leaderboardService.getLeaderboard(404L));

        verify(leaderboardRepository, never()).findByEventIdOrderByRankingAsc(anyLong());
    }
}
