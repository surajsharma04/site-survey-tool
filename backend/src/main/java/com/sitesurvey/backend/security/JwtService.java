package com.sitesurvey.backend.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sitesurvey.backend.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs}")
    private long accessExpirationMs;

    @Value("${app.jwtRefreshExpirationMs}")
    private long refreshExpirationMs;

    public String generateAccessToken(User user) {
        return generateToken(user, accessExpirationMs, "access");
    }

    public String generateRefreshToken(User user) {
        return generateToken(user, refreshExpirationMs, "refresh");
    }

    public Map<String, Object> validate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Map.of();
            }

            String signedContent = parts[0] + "." + parts[1];
            String expectedSignature = sign(signedContent);
            if (!constantTimeEquals(expectedSignature, parts[2])) {
                return Map.of();
            }

            Map<String, Object> claims = OBJECT_MAPPER.readValue(
                    base64UrlDecode(parts[1]),
                    new TypeReference<>() {}
            );
            Number exp = (Number) claims.get("exp");
            if (exp == null || exp.longValue() < Instant.now().getEpochSecond()) {
                return Map.of();
            }
            return claims;
        } catch (Exception exception) {
            return Map.of();
        }
    }

    private String generateToken(User user, long expirationMs, String tokenType) {
        try {
            long now = Instant.now().getEpochSecond();
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> claims = new LinkedHashMap<>();
            claims.put("sub", user.getEmail());
            claims.put("name", user.getFullName());
            claims.put("role", user.getRole());
            claims.put("type", tokenType);
            claims.put("iat", now);
            claims.put("exp", now + expirationMs / 1000);

            String encodedHeader = base64UrlEncode(OBJECT_MAPPER.writeValueAsBytes(header));
            String encodedClaims = base64UrlEncode(OBJECT_MAPPER.writeValueAsBytes(claims));
            String signedContent = encodedHeader + "." + encodedClaims;
            return signedContent + "." + sign(signedContent);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to generate token", exception);
        }
    }

    private String sign(String content) throws Exception {
        Mac mac = Mac.getInstance(HMAC_ALGORITHM);
        mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
        return base64UrlEncode(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
    }

    private static boolean constantTimeEquals(String left, String right) {
        byte[] leftBytes = left.getBytes(StandardCharsets.UTF_8);
        byte[] rightBytes = right.getBytes(StandardCharsets.UTF_8);
        if (leftBytes.length != rightBytes.length) {
            return false;
        }

        int result = 0;
        for (int index = 0; index < leftBytes.length; index += 1) {
            result |= leftBytes[index] ^ rightBytes[index];
        }
        return result == 0;
    }

    private static String base64UrlEncode(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private static byte[] base64UrlDecode(String value) {
        return Base64.getUrlDecoder().decode(value);
    }
}
