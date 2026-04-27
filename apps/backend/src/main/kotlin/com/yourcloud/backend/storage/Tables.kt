package com.yourcloud.backend.storage

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object UsersTable : Table("users") {
    val id = varchar("id", 64)
    val account = varchar("account", 128).uniqueIndex()
    val passwordHash = varchar("password_hash", 255)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}

object FilesTable : Table("files") {
    val id = varchar("id", 64)
    val ownerId = varchar("owner_id", 64).index()
    val name = varchar("name", 255)
    val size = long("size")
    val storageKey = varchar("storage_key", 512)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}

object SharesTable : Table("share_links") {
    val token = varchar("token", 128)
    val fileId = varchar("file_id", 64).index()
    val expireAt = timestamp("expire_at")
    val allowDownload = bool("allow_download")
    val accessCodeHash = varchar("access_code_hash", 255).nullable()
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(token)
}
