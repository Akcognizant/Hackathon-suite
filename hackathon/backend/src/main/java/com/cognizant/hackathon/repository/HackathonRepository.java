package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.Hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HackathonRepository
        extends JpaRepository<Hackathon, Long>, JpaSpecificationExecutor<Hackathon> {

    /** Resolve a hackathon by its (unique-by-convention) title — used by CSV import. */
    Optional<Hackathon> findFirstByTitle(String title);
}
