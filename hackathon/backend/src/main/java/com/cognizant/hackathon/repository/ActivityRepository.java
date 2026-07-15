package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;

/**
 * Paging, sorting, and {@code deleteAllInBatch()} all come from JpaRepository —
 * no custom queries are needed for the feed.
 */
@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    /**
     * Removes feed entries that point at the given submissions. Called during a
     * cascading hackathon delete so the submissions can be removed without tripping
     * the activities.submission_id foreign key.
     */
    void deleteBySubmissionIdIn(Collection<Long> submissionIds);
}
