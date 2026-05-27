package com.sitesurvey.backend.service;

import com.sitesurvey.backend.entity.AuditLog;
import com.sitesurvey.backend.repository.AuditLogRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(String action, String entityType, Long entityId, String changeSet) {
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setChangeSet(changeSet);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getName() != null) {
            auditLog.setChangeSet("{\"actor\":\"" + authentication.getName() + "\",\"change\":" + changeSet + "}");
        }

        auditLogRepository.save(auditLog);
    }
}
