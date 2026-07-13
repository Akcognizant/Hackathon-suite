package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.AssignScoreRequest;
import com.cognizant.hackathon.dto.ScoreResponse;
import com.cognizant.hackathon.entity.Hackathon;
import com.cognizant.hackathon.entity.Score;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.ParticipantRepository;
import com.cognizant.hackathon.repository.ScoreRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScoreServiceTest {

    @Mock
    private SubmissionRepository submissionRepository;
    @Mock
    private ScoreRepository scoreRepository;
    @Mock
    private LeaderboardService leaderboardService;
    @Mock
    private ParticipantRepository participantRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ScoreService scoreService;

    @Captor
    private ArgumentCaptor<Score> scoreCaptor;

    private Submission submissionWithEvent(Long submissionId, Long eventId) {
        Hackathon event = new Hackathon();
        event.setId(eventId);
        return Submission.builder()
                .id(submissionId)
                .projectTitle("Project")
                .hackathon(event)
                .build();
    }

    @Test
    void assignScore_persistsScore_syncsSubmission_andRebuildsLeaderboard() {
        Submission submission = submissionWithEvent(1L, 10L);
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(submission));
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(Optional.empty());

        ScoreResponse response = scoreService.assignScore(new AssignScoreRequest(1L, 90, null));

        // Response carries the assignment + the event it belongs to.
        assertEquals(1L, response.submissionId());
        assertEquals(90, response.score());
        assertEquals(10L, response.eventId());

        // The submission's own score is kept in sync.
        assertEquals(90, submission.getScore());

        // A scores-table row is persisted with the right value + link.
        verify(scoreRepository).save(scoreCaptor.capture());
        assertEquals(90, scoreCaptor.getValue().getValue());
        assertSame(submission, scoreCaptor.getValue().getSubmission());

        verify(submissionRepository).save(submission);
        // Leaderboard is rebuilt for the submission's event.
        verify(leaderboardService).recompute(10L);
    }

    @Test
    void assignScore_reusesExistingScoreRow_whenSubmissionAlreadyScored() {
        Submission submission = submissionWithEvent(2L, 10L);
        Score existing = Score.builder().id(5L).submission(submission).value(40).build();
        when(submissionRepository.findById(2L)).thenReturn(Optional.of(submission));
        when(scoreRepository.findBySubmissionId(2L)).thenReturn(Optional.of(existing));

        scoreService.assignScore(new AssignScoreRequest(2L, 75, null));

        // The same row (id 5) is updated rather than a new one created.
        verify(scoreRepository).save(scoreCaptor.capture());
        assertEquals(5L, scoreCaptor.getValue().getId());
        assertEquals(75, scoreCaptor.getValue().getValue());
    }

    @Test
    void assignScore_throwsAndSkipsSideEffects_whenSubmissionNotFound() {
        when(submissionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> scoreService.assignScore(new AssignScoreRequest(99L, 50, null)));

        verify(scoreRepository, never()).save(any());
        verify(submissionRepository, never()).save(any());
        verify(leaderboardService, never()).recompute(anyLong());
    }
}
