package com.sitesurvey.backend.controller;

import com.sitesurvey.backend.entity.Property;
import com.sitesurvey.backend.repository.BuildingRepository;
import com.sitesurvey.backend.repository.FloorRepository;
import com.sitesurvey.backend.repository.PropertyRepository;
import com.sitesurvey.backend.repository.RfRecordRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final PropertyRepository propertyRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final RfRecordRepository rfRecordRepository;

    public ReportController(
            PropertyRepository propertyRepository,
            BuildingRepository buildingRepository,
            FloorRepository floorRepository,
            RfRecordRepository rfRecordRepository
    ) {
        this.propertyRepository = propertyRepository;
        this.buildingRepository = buildingRepository;
        this.floorRepository = floorRepository;
        this.rfRecordRepository = rfRecordRepository;
    }

    @GetMapping("/generate/{propertyId}")
    public ResponseEntity<byte[]> generatePdfReport(@PathVariable Long propertyId) {
        Property property = propertyRepository.findById(propertyId).orElse(null);
        String title = property == null ? "Site Survey Report" : "Site Survey Report - " + property.getName();
        int buildings = buildingRepository.findByPropertyId(propertyId).size();
        int floors = buildingRepository.findByPropertyId(propertyId).stream()
                .mapToInt(building -> floorRepository.findByBuildingId(building.getId()).size())
                .sum();
        int rfRecords = rfRecordRepository.findByPropertyId(propertyId).size();
        byte[] pdf = simplePdf(title, "Buildings: " + buildings + " | Floors: " + floors + " | RF records: " + rfRecords);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "report_property_" + propertyId + ".pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }

    private byte[] simplePdf(String title, String body) {
        String escapedTitle = escapePdf(title);
        String escapedBody = escapePdf(body);
        String stream = "BT /F1 18 Tf 72 740 Td (" + escapedTitle + ") Tj /F1 12 Tf 0 -32 Td (" + escapedBody + ") Tj ET";
        String pdf = "%PDF-1.4\n"
                + "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
                + "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
                + "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
                + "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
                + "5 0 obj << /Length " + stream.length() + " >> stream\n"
                + stream + "\nendstream endobj\n"
                + "xref\n0 6\n0000000000 65535 f \n"
                + "trailer << /Root 1 0 R /Size 6 >>\nstartxref\n0\n%%EOF";
        return pdf.getBytes(StandardCharsets.UTF_8);
    }

    private String escapePdf(String value) {
        return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }
}
