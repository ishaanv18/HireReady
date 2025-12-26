package com.hireready.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class ClerkService {

    @Value("${clerk.secret.key}")
    private String clerkSecretKey;

    @Value("${clerk.api.url}")
    private String clerkApiUrl;

    private final OkHttpClient httpClient;
    private final Gson gson;

    public ClerkService() {
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build();
        this.gson = new Gson();
    }

    /**
     * Validate Clerk session token
     */
    public boolean validateSessionToken(String sessionToken) {
        try {
            Request request = new Request.Builder()
                    .url(clerkApiUrl + "/sessions/" + sessionToken)
                    .get()
                    .addHeader("Authorization", "Bearer " + clerkSecretKey)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                return response.isSuccessful();
            }
        } catch (IOException e) {
            log.error("Failed to validate Clerk session token", e);
            return false;
        }
    }

    /**
     * Get user info from Clerk
     */
    public ClerkUserInfo getUserInfo(String clerkUserId) {
        try {
            Request request = new Request.Builder()
                    .url(clerkApiUrl + "/users/" + clerkUserId)
                    .get()
                    .addHeader("Authorization", "Bearer " + clerkSecretKey)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.error("Failed to get user info from Clerk: {}", response.code());
                    return null;
                }

                String responseBody = response.body().string();
                JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);

                ClerkUserInfo userInfo = new ClerkUserInfo();
                userInfo.setClerkUserId(jsonResponse.get("id").getAsString());

                // Get username
                if (jsonResponse.has("username") && !jsonResponse.get("username").isJsonNull()) {
                    userInfo.setUsername(jsonResponse.get("username").getAsString());
                }

                // Get email from email_addresses array
                if (jsonResponse.has("email_addresses") && jsonResponse.get("email_addresses").isJsonArray()) {
                    var emailAddresses = jsonResponse.getAsJsonArray("email_addresses");
                    if (emailAddresses.size() > 0) {
                        var primaryEmail = emailAddresses.get(0).getAsJsonObject();
                        userInfo.setEmail(primaryEmail.get("email_address").getAsString());
                    }
                }

                return userInfo;
            }
        } catch (IOException e) {
            log.error("Failed to get user info from Clerk", e);
            return null;
        }
    }

    /**
     * Clerk user info DTO
     */
    public static class ClerkUserInfo {
        private String clerkUserId;
        private String username;
        private String email;

        // Getters and setters
        public String getClerkUserId() {
            return clerkUserId;
        }

        public void setClerkUserId(String clerkUserId) {
            this.clerkUserId = clerkUserId;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }
}
