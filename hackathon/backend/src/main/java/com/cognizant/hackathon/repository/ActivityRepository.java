package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Paging, sorting, and {@code deleteAllInBatch()} all come from JpaRepository —
 * no custom queries are needed for the feed.
 */
@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
}
