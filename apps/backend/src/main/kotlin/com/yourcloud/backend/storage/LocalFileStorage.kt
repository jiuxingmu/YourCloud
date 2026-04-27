package com.yourcloud.backend.storage

import java.io.File
import java.io.InputStream
import java.util.UUID

class LocalFileStorage(
    baseDir: String = "uploads",
) {
    private val root = File(baseDir).also { it.mkdirs() }

    fun save(originalName: String, inputStream: InputStream): String {
        val key = "${UUID.randomUUID()}-$originalName"
        val target = File(root, key)
        target.outputStream().use { output -> inputStream.copyTo(output) }
        return key
    }

    fun saveBytes(originalName: String, bytes: ByteArray): String {
        val key = "${UUID.randomUUID()}-$originalName"
        val target = File(root, key)
        target.writeBytes(bytes)
        return key
    }

    fun open(key: String): File = File(root, key)
}
