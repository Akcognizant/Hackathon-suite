package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.RubricCriterion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RubricCriterionRepository extends JpaRepository<RubricCriterion, Long> {

    List<RubricCriterion> findByHackathonId(Long hackathonId);

    void deleteByHackathonId(Long hackathonId);
}
