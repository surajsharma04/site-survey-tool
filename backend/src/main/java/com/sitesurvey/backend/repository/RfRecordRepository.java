package com.sitesurvey.backend.repository;

import com.sitesurvey.backend.entity.RfRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RfRecordRepository extends JpaRepository<RfRecord, Long> {
    List<RfRecord> findByPropertyId(Long propertyId);
}
