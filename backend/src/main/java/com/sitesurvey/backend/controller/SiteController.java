package com.sitesurvey.backend.controller;

import com.opencsv.CSVReader;
import com.sitesurvey.backend.entity.*;
import com.sitesurvey.backend.repository.*;
import com.sitesurvey.backend.service.AuditService;
import com.sitesurvey.backend.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sites")
public class SiteController {
    private final FileService fileService;
    private final PropertyRepository propertyRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final SpaceRepository spaceRepository;
    private final StoredFileRepository storedFileRepository;
    private final AuditService auditService;

    public SiteController(
            FileService fileService,
            PropertyRepository propertyRepository,
            BuildingRepository buildingRepository,
            FloorRepository floorRepository,
            SpaceRepository spaceRepository,
            StoredFileRepository storedFileRepository,
            AuditService auditService
    ) {
        this.fileService = fileService;
        this.propertyRepository = propertyRepository;
        this.buildingRepository = buildingRepository;
        this.floorRepository = floorRepository;
        this.spaceRepository = spaceRepository;
        this.storedFileRepository = storedFileRepository;
        this.auditService = auditService;
    }

    @GetMapping("/properties")
    public ResponseEntity<?> getProperties() {
        return ResponseEntity.ok(propertyRepository.findAll().stream().map(this::propertyDto).toList());
    }

    @PostMapping("/properties")
    @PreAuthorize("hasAnyAuthority('Network Planner','Operations Manager')")
    public ResponseEntity<?> createProperty(@RequestBody Map<String, Object> request) {
        Property property = new Property();
        property.setName(requiredString(request, "name"));
        property.setAddressLine1(text(request, "addressLine1", text(request, "address", "")));
        property.setCity(text(request, "city", ""));
        property.setState(text(request, "state", ""));
        property.setPostalCode(text(request, "postalCode", ""));
        property.setCountry(text(request, "country", ""));
        property.setCentroidLat(decimal(request, "centroidLat"));
        property.setCentroidLon(decimal(request, "centroidLon"));

        Property saved = propertyRepository.save(property);
        auditService.record("CREATE", "Property", saved.getId(), "{\"name\":\"" + saved.getName() + "\"}");
        return ResponseEntity.ok(propertyDto(saved));
    }

    @PutMapping("/properties/{propertyId}")
    @PreAuthorize("hasAnyAuthority('Network Planner','Operations Manager')")
    public ResponseEntity<?> updateProperty(@PathVariable Long propertyId, @RequestBody Map<String, Object> request) {
        return propertyRepository.findById(propertyId)
                .map(property -> {
                    property.setName(text(request, "name", property.getName()));
                    property.setAddressLine1(text(request, "addressLine1", property.getAddressLine1()));
                    property.setCity(text(request, "city", property.getCity()));
                    property.setState(text(request, "state", property.getState()));
                    property.setPostalCode(text(request, "postalCode", property.getPostalCode()));
                    property.setCountry(text(request, "country", property.getCountry()));
                    Property saved = propertyRepository.save(property);
                    auditService.record("UPDATE", "Property", saved.getId(), "{\"name\":\"" + saved.getName() + "\"}");
                    return ResponseEntity.ok(propertyDto(saved));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/properties/{propertyId}")
    @PreAuthorize("hasAuthority('Operations Manager')")
    public ResponseEntity<?> deleteProperty(@PathVariable Long propertyId) {
        if (!propertyRepository.existsById(propertyId)) {
            return ResponseEntity.notFound().build();
        }
        propertyRepository.deleteById(propertyId);
        auditService.record("DELETE", "Property", propertyId, "{}");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/properties/{propertyId}/buildings")
    public ResponseEntity<?> getBuildings(@PathVariable Long propertyId) {
        return ResponseEntity.ok(buildingRepository.findByPropertyId(propertyId).stream().map(this::buildingDto).toList());
    }

    @PostMapping("/properties/{propertyId}/buildings")
    @PreAuthorize("hasAnyAuthority('Network Planner','Operations Manager')")
    public ResponseEntity<?> createBuilding(@PathVariable Long propertyId, @RequestBody Map<String, Object> request) {
        return propertyRepository.findById(propertyId)
                .map(property -> {
                    Building building = new Building();
                    building.setProperty(property);
                    building.setName(requiredString(request, "name"));
                    building.setCode(text(request, "code", ""));
                    building.setFloorsCount(integer(request, "floorsCount"));
                    Building saved = buildingRepository.save(building);
                    auditService.record("CREATE", "Building", saved.getId(), "{\"propertyId\":" + propertyId + "}");
                    return ResponseEntity.ok(buildingDto(saved));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/buildings/{buildingId}/floors")
    public ResponseEntity<?> getFloors(@PathVariable Long buildingId) {
        return ResponseEntity.ok(floorRepository.findByBuildingId(buildingId).stream().map(this::floorDto).toList());
    }

    @PostMapping("/buildings/{buildingId}/floors")
    @PreAuthorize("hasAnyAuthority('Network Planner','Operations Manager')")
    public ResponseEntity<?> createFloor(@PathVariable Long buildingId, @RequestBody Map<String, Object> request) {
        return buildingRepository.findById(buildingId)
                .map(building -> {
                    Floor floor = new Floor();
                    floor.setBuilding(building);
                    floor.setLevelLabel(requiredString(request, "levelLabel"));
                    floor.setElevationM(decimal(request, "elevationM"));
                    Floor saved = floorRepository.save(floor);
                    auditService.record("CREATE", "Floor", saved.getId(), "{\"buildingId\":" + buildingId + "}");
                    return ResponseEntity.ok(floorDto(saved));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/floors/{floorId}/spaces")
    public ResponseEntity<?> getSpaces(@PathVariable Long floorId) {
        return ResponseEntity.ok(spaceRepository.findByFloorId(floorId).stream().map(this::spaceDto).toList());
    }

    @PostMapping("/floors/{floorId}/spaces")
    public ResponseEntity<?> createSpace(@PathVariable Long floorId, @RequestBody Map<String, Object> request) {
        return floorRepository.findById(floorId)
                .map(floor -> {
                    Space space = new Space();
                    space.setFloor(floor);
                    space.setName(requiredString(request, "name"));
                    space.setType(text(request, "type", ""));
                    space.setAreaSqM(decimal(request, "areaSqM"));
                    space.setNotes(text(request, "notes", ""));
                    Space saved = spaceRepository.save(space);
                    auditService.record("CREATE", "Space", saved.getId(), "{\"floorId\":" + floorId + "}");
                    return ResponseEntity.ok(spaceDto(saved));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/floors/{floorId}/plan")
    public ResponseEntity<?> uploadFloorPlan(@PathVariable Long floorId, @RequestParam("file") MultipartFile file) {
        try {
            return floorRepository.findById(floorId)
                    .map(floor -> {
                        try {
                            String objectKey = fileService.uploadFile(file);
                            StoredFile storedFile = new StoredFile();
                            storedFile.setObjectKey(objectKey);
                            storedFile.setOriginalName(file.getOriginalFilename());
                            storedFile.setContentType(file.getContentType());
                            storedFile.setSizeBytes(file.getSize());
                            storedFile.setEntityType("Floor");
                            storedFile.setEntityId(floorId);
                            StoredFile savedFile = storedFileRepository.save(storedFile);

                            floor.setPlanFileId(savedFile.getId());
                            floorRepository.save(floor);
                            auditService.record("UPLOAD_PLAN", "Floor", floorId, "{\"fileId\":" + savedFile.getId() + "}");
                            return ResponseEntity.ok(Map.of("fileId", savedFile.getId(), "objectKey", objectKey));
                        } catch (Exception exception) {
                            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to upload file: " + exception.getMessage()));
                        }
                    })
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception exception) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to upload file: " + exception.getMessage()));
        }
    }

    @PostMapping("/floors/{floorId}/spaces/import")
    public ResponseEntity<?> importSpacesCsv(@PathVariable Long floorId, @RequestParam("file") MultipartFile file) {
        try {
            Floor floor = floorRepository.findById(floorId).orElseThrow();
            List<Space> spaces = new ArrayList<>();

            try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
                List<String[]> lines = reader.readAll();
                for (int index = 1; index < lines.size(); index += 1) {
                    String[] line = lines.get(index);
                    if (line.length < 3) {
                        continue;
                    }
                    Space space = new Space();
                    space.setFloor(floor);
                    space.setName(line[0]);
                    space.setType(line[1]);
                    space.setAreaSqM(new BigDecimal(line[2]));
                    spaces.add(space);
                }
            }
            List<Space> saved = spaceRepository.saveAll(spaces);
            auditService.record("IMPORT_SPACES", "Floor", floorId, "{\"count\":" + saved.size() + "}");
            return ResponseEntity.ok(Map.of("imported", saved.size(), "spaces", saved.stream().map(this::spaceDto).toList()));
        } catch (Exception exception) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to import CSV: " + exception.getMessage()));
        }
    }

    private Map<String, Object> propertyDto(Property property) {
        return Map.of(
                "id", property.getId(),
                "name", property.getName(),
                "address", nullSafe(property.getAddressLine1()),
                "city", nullSafe(property.getCity()),
                "state", nullSafe(property.getState()),
                "country", nullSafe(property.getCountry())
        );
    }

    private Map<String, Object> buildingDto(Building building) {
        return Map.of(
                "id", building.getId(),
                "propertyId", building.getProperty() == null ? null : building.getProperty().getId(),
                "name", building.getName(),
                "code", nullSafe(building.getCode()),
                "floorsCount", building.getFloorsCount() == null ? 0 : building.getFloorsCount()
        );
    }

    private Map<String, Object> floorDto(Floor floor) {
        return Map.of(
                "id", floor.getId(),
                "buildingId", floor.getBuilding() == null ? null : floor.getBuilding().getId(),
                "levelLabel", floor.getLevelLabel(),
                "planFileId", floor.getPlanFileId() == null ? 0 : floor.getPlanFileId()
        );
    }

    private Map<String, Object> spaceDto(Space space) {
        return Map.of(
                "id", space.getId(),
                "floorId", space.getFloor() == null ? null : space.getFloor().getId(),
                "name", space.getName(),
                "type", nullSafe(space.getType()),
                "areaSqM", space.getAreaSqM() == null ? "" : space.getAreaSqM().toPlainString(),
                "notes", nullSafe(space.getNotes())
        );
    }

    private String requiredString(Map<String, Object> request, String key) {
        String value = text(request, key, "");
        if (value.isBlank()) {
            throw new IllegalArgumentException(key + " is required");
        }
        return value;
    }

    private String text(Map<String, Object> request, String key, String defaultValue) {
        Object value = request.get(key);
        return value == null ? defaultValue : value.toString().trim();
    }

    private BigDecimal decimal(Map<String, Object> request, String key) {
        Object value = request.get(key);
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        return new BigDecimal(value.toString());
    }

    private Integer integer(Map<String, Object> request, String key) {
        Object value = request.get(key);
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        return Integer.valueOf(value.toString());
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }
}
