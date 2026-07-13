package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {

    Optional<Score> findBySubmissionId(Long submissionId);
}
