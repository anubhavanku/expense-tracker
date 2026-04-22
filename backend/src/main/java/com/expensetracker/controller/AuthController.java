package com.expensetracker.controller;

import com.expensetracker.config.JwtUtil;
import com.expensetracker.dto.AuthRequest;
import com.expensetracker.dto.AuthResponse;
import com.expensetracker.dto.UserDTO;
import com.expensetracker.model.User;
import com.expensetracker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestBody Map<String, String> request) {
        UserDTO user = userService.registerUser(
                request.get("username"),
                request.get("email"),
                request.get("password")
        );
        String token = jwtUtil.generateToken(user.getEmail(), user.getId());
        return ResponseEntity.ok(
                new AuthResponse(token, user.getId(),
                        user.getUsername(), user.getEmail())
        );
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody AuthRequest request) {
        try {
            User user = userService.findByEmail(request.getEmail());
            if (!passwordEncoder.matches(
                    request.getPassword(), user.getPassword())) {
                return ResponseEntity.status(401).build();
            }
            String token = jwtUtil.generateToken(
                    user.getEmail(), user.getId());
            return ResponseEntity.ok(
                    new AuthResponse(token, user.getId(),
                            user.getUsername(), user.getEmail())
            );
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(
                userService.updateUser(id,
                        request.get("username"),
                        request.get("email"))
        );
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<Void> updatePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        userService.updatePassword(id, request.get("newPassword"));
        return ResponseEntity.ok().build();
    }
}