package com.yourcloud.backend.service

import at.favre.lib.crypto.bcrypt.BCrypt
import com.yourcloud.backend.model.AccessDecision
import com.yourcloud.backend.model.ShareLink
import java.time.Instant
import java.util.UUID

class ShareService {
    fun createShare(
        fileId: String,
        expireAt: Instant,
        allowDownload: Boolean,
        accessCode: String?,
    ): ShareLink {
        val token = UUID.randomUUID().toString().replace("-", "")
        val accessCodeHash = accessCode?.let { BCrypt.withDefaults().hashToString(10, it.toCharArray()) }
        return ShareLink(
            token = token,
            fileId = fileId,
            expireAt = expireAt,
            allowDownload = allowDownload,
            accessCodeHash = accessCodeHash,
        )
    }

    fun validateAccess(shareLink: ShareLink, accessCode: String?): AccessDecision {
        if (Instant.now().isAfter(shareLink.expireAt)) {
            return AccessDecision(false, "分享已过期")
        }
        if (!shareLink.allowDownload) {
            return AccessDecision(false, "当前分享不允许下载")
        }
        if (shareLink.accessCodeHash != null) {
            if (accessCode.isNullOrBlank()) {
                return AccessDecision(false, "需要提取码")
            }
            val verified = BCrypt.verifyer().verify(accessCode.toCharArray(), shareLink.accessCodeHash).verified
            if (!verified) {
                return AccessDecision(false, "提取码错误")
            }
        }
        return AccessDecision(true)
    }
}
