package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long>, JpaSpecificationExecutor<Team> {

    Optional<Team> findFirstByName(String name);

    /** Scoped lookup: a team by name within a specific hackathon (multi-tenant isolation). */
    Optional<Team> findFirstByNameAndHackathonId(String name, Long hackathonId);

    /** Number of teams registered for a hackathon (participant-portal event listing). */
    long countByHackathonId(Long hackathonId);

    /** Teams registered for a hackathon. */
    java.util.List<Team> findByHackathonId(Long hackathonId);
}
