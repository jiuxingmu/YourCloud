package com.yourcloud.backend

import kotlin.test.Test
import kotlin.test.assertEquals

class ApplicationErrorTest {
    @Test
    fun `normalizeErrorMessage should fallback for blank messages`() {
        val throwable = IllegalStateException("   ")
        val result = normalizeErrorMessage(throwable)
        assertEquals("服务器内部错误，请稍后再试", result)
    }

    @Test
    fun `normalizeErrorMessage should keep non blank messages`() {
        val throwable = IllegalStateException("磁盘空间不足")
        val result = normalizeErrorMessage(throwable)
        assertEquals("磁盘空间不足", result)
    }
}
