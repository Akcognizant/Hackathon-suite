package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantRepository
        extends JpaRepository<Participant, Long>, JpaSpecificationExecutor<Participant> {

    Optional<Participant> findByEmail(String email);

    /**
     * All roster rows for an email. A participant account can belong to several
     * teams (one row per team), so this returns a List rather than an Optional.
     */
    List<Participant> findAllByEmail(String email);

    /** Members of a team (for the scouting profile). */
    List<Participant> findByTeamId(Long teamId);
}
