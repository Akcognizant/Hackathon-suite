package com.cognizant.hackathon.repository;

import com.cognizant.hackathon.entity.AccessRequest;
import com.cognizant.hackathon.entity.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccessRequestRepository extends JpaRepository<AccessRequest, Long> {

    List<AccessRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    List<AccessRequest> findAllByOrderByCreatedAtDesc();

    boolean existsByEmailAndStatus(String email, RequestStatus status);

    long countByStatus(RequestStatus status);
}
