package com.yourcloud.backend.model

import java.time.Instant

data class User(
    val id: String,
    val account: String,
    val passwordHash: String,
)

data class FileRecord(
    val id: String,
    val ownerId: String,
    val name: String,
    val size: Long,
    val storageKey: String,
    val createdAt: Instant,
)

data class ShareLink(
    val token: String,
    val fileId: String,
    val expireAt: Instant,
    val allowDownload: Boolean,
    val accessCodeHash: String?,
)

data class AccessDecision(
    val allowed: Boolean,
    val reason: String? = null,
)
