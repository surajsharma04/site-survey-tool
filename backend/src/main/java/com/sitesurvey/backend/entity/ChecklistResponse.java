package com.sitesurvey.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "checklist_responses")
public class ChecklistResponse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long propertyId;

    private Long floorId;

    private Long spaceId;

    private Long templateId;

    @Column(length = 40)
    private String status = "draft";

    @Column(nullable = false, columnDefinition = "JSON")
    private String responseJson;

    @Column(length = 320)
    private String submittedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
