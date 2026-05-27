package com.sitesurvey.backend.controller;

import com.opencsv.CSVReader;
import com.sitesurvey.backend.entity.RfRecord;
import com.sitesurvey.backend.repository.RfRecordRepository;
import com.sitesurvey.backend.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

@RestController
@RequestMapping("/api/integration/rf")
public class RFIntegrationController {
    private final RfRecordRepository rfRecordRepository;
    private final AuditService auditService;

    public RFIntegrationController(RfRecordRepository rfRecordRepository, AuditService auditService) {
        this.rfRecordRepository = rfRecordRepository;
        this.auditService = auditService;
    }

    @PostMapping("/import/{toolName}")
    public ResponseEntity<?> importRFData(
            @PathVariable String toolName,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "propertyId", required = false) Long propertyId
    ) {
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            List<String[]> lines = reader.readAll();
            if (lines.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "RF CSV file is empty"));
            }

            List<RfRecord> records = new ArrayList<>();
            String[] header = lines.get(0);
            for (int index = 1; index < lines.size(); index += 1) {
                String[] line = lines.get(index);
                RfRecord record = new RfRecord();
                record.setToolName(toolName.toLowerCase());
                record.setPropertyId(propertyId);
                record.setSsid(value(header, line, "ssid", "SSID", "network"));
                record.setBssid(value(header, line, "bssid", "BSSID", "mac"));
                record.setSignalDbm(integer(value(header, line, "signal_dbm", "Signal", "RSSI", "signal")));
                record.setLatitude(decimal(value(header, line, "lat", "latitude", "Latitude")));
                record.setLongitude(decimal(value(header, line, "lon", "lng", "longitude", "Longitude")));
                records.add(record);
            }

            List<RfRecord> saved = rfRecordRepository.saveAll(records);
            auditService.record("IMPORT_RF", "Property", propertyId, "{\"tool\":\"" + toolName + "\",\"count\":" + saved.size() + "}");
            return ResponseEntity.ok(Map.of(
                    "tool", toolName,
                    "status", "success",
                    "recordsProcessed", saved.size(),
                    "message", "RF coverage data imported and stored for overlay."
            ));
        } catch (Exception exception) {
            return ResponseEntity.internalServerError().body(Map.of("message", "RF import failed: " + exception.getMessage()));
        }
    }
    
    @GetMapping("/export/{propertyId}")
    public ResponseEntity<?> exportRFData(@PathVariable Long propertyId) {
        StringBuilder csv = new StringBuilder("lat,lon,signal_dbm,ssid,bssid,tool\n");
        for (RfRecord record : rfRecordRepository.findByPropertyId(propertyId)) {
            StringJoiner row = new StringJoiner(",");
            row.add(text(record.getLatitude()));
            row.add(text(record.getLongitude()));
            row.add(text(record.getSignalDbm()));
            row.add(escape(record.getSsid()));
            row.add(escape(record.getBssid()));
            row.add(escape(record.getToolName()));
            csv.append(row).append("\n");
        }
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=rf_export.csv")
                .body(csv.toString());
    }

    @GetMapping("/records/{propertyId}")
    public ResponseEntity<?> records(@PathVariable Long propertyId) {
        return ResponseEntity.ok(rfRecordRepository.findByPropertyId(propertyId));
    }

    private String value(String[] header, String[] line, String... names) {
        for (String name : names) {
            for (int index = 0; index < header.length && index < line.length; index += 1) {
                if (header[index].trim().equalsIgnoreCase(name)) {
                    return line[index].trim();
                }
            }
        }
        return "";
    }

    private BigDecimal decimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return new BigDecimal(value);
    }

    private Integer integer(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return (int) Math.round(Double.parseDouble(value.replace("dBm", "").trim()));
    }

    private String text(Object value) {
        return value == null ? "" : value.toString();
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
