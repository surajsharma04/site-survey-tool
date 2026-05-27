package com.sitesurvey.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "spaces")
public class Space {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id")
    private Floor floor;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 50)
    private String type;

    @Column(precision = 10, scale = 2)
    private BigDecimal areaSqM;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void setFloor(Floor floor) { this.floor = floor; }
    public void setName(String name) { this.name = name; }
    public void setType(String type) { this.type = type; }
    public void setAreaSqM(BigDecimal areaSqM) { this.areaSqM = areaSqM; }
}
