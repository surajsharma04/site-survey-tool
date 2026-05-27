package com.sitesurvey.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "rf_records")
public class RfRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long propertyId;

    @Column(length = 40)
    private String toolName;

    @Column(length = 120)
    private String ssid;

    @Column(length = 120)
    private String bssid;

    private Integer signalDbm;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
