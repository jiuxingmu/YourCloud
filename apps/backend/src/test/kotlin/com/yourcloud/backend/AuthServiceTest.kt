package com.yourcloud.backend

import com.yourcloud.backend.service.AuthService
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class AuthServiceTest {
    @Test
    fun `hash password should be verifiable`() {
        val authService = AuthService("test-secret")
        val raw = "pass@123456"

        val hashed = authService.hashPassword(raw)

        assertNotEquals(raw, hashed)
        assertTrue(authService.verifyPassword(raw, hashed))
        assertFalse(authService.verifyPassword("wrong-password", hashed))
    }

    @Test
    fun `issue token should include user id claim`() {
        val authService = AuthService("test-secret")

        val token = authService.issueAccessToken("user-1")
        val decodedUserId = authService.verifyAndExtractUserId(token)

        assertTrue(decodedUserId == "user-1")
    }
}
