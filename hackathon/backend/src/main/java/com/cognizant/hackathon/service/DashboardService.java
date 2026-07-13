package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.DashboardStatsDto;
import com.cognizant.hackathon.entity.enums.SubmissionStatus;
import com.cognizant.hackathon.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Computes admin dashboard statistics using repository-level COUNT queries,
 * so no submission rows are loaded into memory.
 *
 * <p>Null/empty-safe by construction: {@code count*} queries return a primitive
 * {@code long} (0 when the table is empty), so there is nothing to NPE on.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SubmissionRepository submissionRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDto getStats() {
        long totalSubmissions = submissionRepository.count();
        long pendingCount = submissionRepository.countByStatus(SubmissionStatus.PENDING);
        long scoredCount = submissionRepository.countByScoreIsNotNull();

        return new DashboardStatsDto(totalSubmissions, pendingCount, scoredCount);
    }
}
