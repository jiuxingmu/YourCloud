package com.yourcloud.backend

import com.yourcloud.backend.model.ShareLink
import com.yourcloud.backend.service.ShareService
import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ShareServiceTest {
    @Test
    fun `validate share access should fail when expired`() {
        val service = ShareService()
        val share = ShareLink(
            token = "token",
            fileId = "file-1",
            expireAt = Instant.now().minusSeconds(60),
            allowDownload = true,
            accessCodeHash = null,
        )

        val result = service.validateAccess(share, null)

        assertFalse(result.allowed)
    }

    @Test
    fun `validate share access should check access code`() {
        val service = ShareService()
        val share = service.createShare(
            fileId = "file-1",
            expireAt = Instant.now().plusSeconds(300),
            allowDownload = true,
            accessCode = "1234",
        )

        val denied = service.validateAccess(share, "0000")
        val allowed = service.validateAccess(share, "1234")

        assertFalse(denied.allowed)
        assertTrue(allowed.allowed)
    }

    @Test
    fun `validate share access should require access code when configured`() {
        val service = ShareService()
        val share = service.createShare(
            fileId = "file-1",
            expireAt = Instant.now().plusSeconds(300),
            allowDownload = true,
            accessCode = "1234",
        )

        val denied = service.validateAccess(share, null)

        assertFalse(denied.allowed)
    }
}
