package com.sitesurvey.backend.repository;

import com.sitesurvey.backend.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {}
