package com.yourcloud.shared

import kotlinx.serialization.Serializable

@Serializable
data class AuthRequest(
    val account: String,
    val password: String,
)

@Serializable
data class AuthResponse(
    val token: String,
)

@Serializable
data class FileItem(
    val id: String,
    val name: String,
    val size: Long,
    val createdAt: String,
)

@Serializable
data class ShareCreateRequest(
    val fileId: String,
    val expireAtEpochSeconds: Long,
    val accessCode: String? = null,
)

@Serializable
data class ShareCreateResponse(
    val token: String,
    val url: String,
)

@Serializable
data class ShareDownloadRequest(
    val accessCode: String? = null,
)
