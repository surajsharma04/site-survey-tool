package com.sitesurvey.backend.controller;

import com.sitesurvey.backend.entity.User;
import com.sitesurvey.backend.repository.UserRepository;
import com.sitesurvey.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.getOrDefault("email", "").trim().toLowerCase();
        String password = loginRequest.getOrDefault("password", "");

        return userRepository.findByEmail(email)
                .filter(user -> passwordEncoder.matches(password, user.getPassword()))
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(Map.of(
                        "accessToken", jwtService.generateAccessToken(user),
                        "refreshToken", jwtService.generateRefreshToken(user),
                        "email", user.getEmail(),
                        "name", user.getFullName(),
                        "role", user.getRole()
                )))
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of("message", "Invalid email or password")));
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> signUpRequest) {
        String email = signUpRequest.getOrDefault("email", "").trim().toLowerCase();
        String fullName = signUpRequest.getOrDefault("fullName", "").trim();
        String password = signUpRequest.getOrDefault("password", "");
        String role = signUpRequest.getOrDefault("role", "Field Engineer").trim();

        if (email.isBlank() || fullName.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email, and password are required"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is already registered"));
        }

        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role.isBlank() ? "Field Engineer" : role);
        user.setAuthProvider("local");
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User registered successfully", "email", user.getEmail(), "role", user.getRole()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> refreshRequest) {
        Map<String, Object> claims = jwtService.validate(refreshRequest.getOrDefault("refreshToken", ""));
        if (!"refresh".equals(claims.get("type"))) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid refresh token"));
        }

        return userRepository.findByEmail((String) claims.get("sub"))
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(Map.of(
                        "accessToken", jwtService.generateAccessToken(user),
                        "refreshToken", jwtService.generateRefreshToken(user)
                )))
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of("message", "User no longer exists")));
    }
}
