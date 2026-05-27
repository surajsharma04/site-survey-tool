package com.sitesurvey.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sitesurvey.backend.entity.ChecklistResponse;
import com.sitesurvey.backend.entity.ChecklistTemplate;
import com.sitesurvey.backend.repository.ChecklistResponseRepository;
import com.sitesurvey.backend.repository.ChecklistTemplateRepository;
import com.sitesurvey.backend.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/checklists")
public class ChecklistController {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final ChecklistTemplateRepository templateRepository;
    private final ChecklistResponseRepository responseRepository;
    private final AuditService auditService;

    public ChecklistController(
            ChecklistTemplateRepository templateRepository,
            ChecklistResponseRepository responseRepository,
            AuditService auditService
    ) {
        this.templateRepository = templateRepository;
        this.responseRepository = responseRepository;
        this.auditService = auditService;
    }

    @GetMapping("/templates")
    public ResponseEntity<?> templates() {
        return ResponseEntity.ok(templateRepository.findAll());
    }

    @PostMapping("/templates")
    public ResponseEntity<?> createTemplate(@RequestBody Map<String, Object> request) throws Exception {
        ChecklistTemplate template = new ChecklistTemplate();
        template.setName(request.getOrDefault("name", "Site Survey Checklist").toString());
        template.setSchemaJson(OBJECT_MAPPER.writeValueAsString(request.getOrDefault("schema", Map.of())));
        ChecklistTemplate saved = templateRepository.save(template);
        auditService.record("CREATE", "ChecklistTemplate", saved.getId(), "{\"name\":\"" + saved.getName() + "\"}");
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/responses/property/{propertyId}")
    public ResponseEntity<?> responsesForProperty(@PathVariable Long propertyId) {
        return ResponseEntity.ok(responseRepository.findByPropertyId(propertyId));
    }

    @PostMapping("/responses")
    public ResponseEntity<?> saveResponse(@RequestBody Map<String, Object> request) throws Exception {
        ChecklistResponse response = new ChecklistResponse();
        response.setPropertyId(longValue(request, "propertyId"));
        response.setFloorId(longValue(request, "floorId"));
        response.setSpaceId(longValue(request, "spaceId"));
        response.setTemplateId(longValue(request, "templateId"));
        response.setStatus(request.getOrDefault("status", "draft").toString());
        response.setResponseJson(OBJECT_MAPPER.writeValueAsString(request.getOrDefault("response", Map.of())));
        response.setSubmittedBy(SecurityContextHolder.getContext().getAuthentication().getName());
        ChecklistResponse saved = responseRepository.save(response);
        auditService.record("SAVE", "ChecklistResponse", saved.getId(), "{\"status\":\"" + saved.getStatus() + "\"}");
        return ResponseEntity.ok(saved);
    }

    private Long longValue(Map<String, Object> request, String key) {
        Object value = request.get(key);
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        return Long.valueOf(value.toString());
    }
}
