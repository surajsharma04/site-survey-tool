package com.sitesurvey.backend.repository;

import com.sitesurvey.backend.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {
    List<StoredFile> findByEntityTypeAndEntityId(String entityType, Long entityId);
}
