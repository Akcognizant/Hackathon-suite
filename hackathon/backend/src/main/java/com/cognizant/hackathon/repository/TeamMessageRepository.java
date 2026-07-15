package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.TeamMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface TeamMessageRepository extends JpaRepository<TeamMessage, Long> {

    /** Chronological message history for a team (oldest first, for chat rendering). */
    List<TeamMessage> findByTeamIdOrderByCreatedAtAsc(Long teamId);

    /** Bulk-remove the message logs of the given teams (used by the cascading hackathon delete). */
    void deleteByTeamIdIn(Collection<Long> teamIds);
}
