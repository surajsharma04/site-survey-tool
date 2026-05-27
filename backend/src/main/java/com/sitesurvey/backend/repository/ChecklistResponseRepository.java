package com.sitesurvey.backend.repository;

import com.sitesurvey.backend.entity.ChecklistResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChecklistResponseRepository extends JpaRepository<ChecklistResponse, Long> {
    List<ChecklistResponse> findByPropertyId(Long propertyId);
}
