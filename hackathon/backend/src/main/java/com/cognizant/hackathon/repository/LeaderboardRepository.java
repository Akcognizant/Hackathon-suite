package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.Leaderboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaderboardRepository extends JpaRepository<Leaderboard, Long> {

    List<Leaderboard> findByEventIdOrderByRankingAsc(Long eventId);

    void deleteByEventId(Long eventId);
}
