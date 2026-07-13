package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.TeamMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamMessageRepository extends JpaRepository<TeamMessage, Long> {

    /** Chronological message history for a team (oldest first, for chat rendering). */
    List<TeamMessage> findByTeamIdOrderByCreatedAtAsc(Long teamId);
}
