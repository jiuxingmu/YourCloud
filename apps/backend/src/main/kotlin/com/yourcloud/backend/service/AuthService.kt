package com.yourcloud.backend.service

import at.favre.lib.crypto.bcrypt.BCrypt
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.time.Instant
import java.util.Date

class AuthService(
    private val jwtSecret: String,
) {
    private val algorithm = Algorithm.HMAC256(jwtSecret)

    fun hashPassword(rawPassword: String): String =
        BCrypt.withDefaults().hashToString(12, rawPassword.toCharArray())

    fun verifyPassword(rawPassword: String, hashedPassword: String): Boolean =
        BCrypt.verifyer().verify(rawPassword.toCharArray(), hashedPassword).verified

    fun issueAccessToken(userId: String): String {
        val now = Instant.now()
        return JWT.create()
            .withSubject(userId)
            .withClaim("uid", userId)
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(now.plusSeconds(3600)))
            .sign(algorithm)
    }

    fun verifyAndExtractUserId(token: String): String {
        val verifier = JWT.require(algorithm).build()
        val decoded = verifier.verify(token)
        return decoded.getClaim("uid").asString()
    }
}
