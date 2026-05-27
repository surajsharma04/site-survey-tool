package com.sitesurvey.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "stored_files")
public class StoredFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String objectKey;

    @Column(nullable = false)
    private String originalName;

    @Column(length = 120)
    private String contentType;

    private Long sizeBytes;

    @Column(length = 80)
    private String entityType;

    private Long entityId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
