package com.sitesurvey.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sitesurvey.backend.entity.*;
import com.sitesurvey.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
public class DataSeeder implements CommandLineRunner {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final ChecklistTemplateRepository checklistTemplateRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            PropertyRepository propertyRepository,
            BuildingRepository buildingRepository,
            FloorRepository floorRepository,
            ChecklistTemplateRepository checklistTemplateRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.buildingRepository = buildingRepository;
        this.floorRepository = floorRepository;
        this.checklistTemplateRepository = checklistTemplateRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedSurveyHierarchy();
        seedChecklistTemplate();
    }

    private void seedUsers() {
        createUser("engineer@netgrid.local", "Field Engineer", "Field Engineer");
        createUser("planner@netgrid.local", "Network Planner", "Network Planner");
        createUser("manager@netgrid.local", "Operations Manager", "Operations Manager");
    }

    private void createUser(String email, String fullName, String role) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role);
        user.setAuthProvider("local");
        user.setPassword(passwordEncoder.encode("ChangeMe123!"));
        userRepository.save(user);
    }

    private void seedSurveyHierarchy() {
        if (propertyRepository.count() > 0) {
            return;
        }

        Property property = new Property();
        property.setName("Riverside MDU");
        property.setAddressLine1("18 Riverfront Road");
        property.setCity("Kochi");
        property.setState("Kerala");
        property.setCountry("India");
        property.setCentroidLat(new BigDecimal("9.9670000"));
        property.setCentroidLon(new BigDecimal("76.2450000"));
        Property savedProperty = propertyRepository.save(property);

        Building building = new Building();
        building.setProperty(savedProperty);
        building.setName("Tower A");
        building.setCode("A");
        building.setFloorsCount(12);
        Building savedBuilding = buildingRepository.save(building);

        for (String label : List.of("Ground", "Level 1", "Level 2")) {
            Floor floor = new Floor();
            floor.setBuilding(savedBuilding);
            floor.setLevelLabel(label);
            floorRepository.save(floor);
        }
    }

    private void seedChecklistTemplate() throws Exception {
        if (checklistTemplateRepository.count() > 0) {
            return;
        }
        ChecklistTemplate template = new ChecklistTemplate();
        template.setName("ISP Site Survey");
        template.setSchemaJson(OBJECT_MAPPER.writeValueAsString(Map.of(
                "sections", List.of(
                        "Access and riser route",
                        "Power and grounding",
                        "Cooling and rack space",
                        "RF scan and interference",
                        "Install readiness notes"
                )
        )));
        checklistTemplateRepository.save(template);
    }
}
