package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.entity.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface SubmissionRepository
        extends JpaRepository<Submission, Long>, JpaSpecificationExecutor<Submission> {

    List<Submission> findByStatus(SubmissionStatus status);

    List<Submission> findByScoreIsNotNull();

    List<Submission> findByHackathonId(Long hackathonId);

    /** A team's submissions (used to source its repository link for scouting). */
    List<Submission> findByTeamId(Long teamId);

    /** Submissions for a set of teams — batch lookup for the scouting directory page. */
    List<Submission> findByTeamIdIn(Collection<Long> teamIds);

    /** Efficient COUNT(*) ... WHERE status = ? — no entities loaded. */
    long countByStatus(SubmissionStatus status);

    /** Efficient COUNT(*) ... WHERE score IS NOT NULL. */
    long countByScoreIsNotNull();
}
