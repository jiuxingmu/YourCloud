package com.yourcloud.backend.storage

import com.yourcloud.backend.model.FileRecord
import com.yourcloud.backend.model.ShareLink
import com.yourcloud.backend.model.User
import java.time.Instant
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

class UserRepository {
    fun existsByAccount(account: String): Boolean = transaction {
        UsersTable.selectAll().where { UsersTable.account eq account }.count() > 0
    }

    fun create(user: User) = transaction {
        UsersTable.insert {
            it[id] = user.id
            it[account] = user.account
            it[passwordHash] = user.passwordHash
            it[createdAt] = Instant.now()
        }
    }

    fun findByAccount(account: String): User? = transaction {
        UsersTable.selectAll().where { UsersTable.account eq account }
            .limit(1)
            .firstOrNull()
            ?.toUser()
    }
}

class FileRepository {
    fun create(file: FileRecord) = transaction {
        FilesTable.insert {
            it[id] = file.id
            it[ownerId] = file.ownerId
            it[name] = file.name
            it[size] = file.size
            it[storageKey] = file.storageKey
            it[createdAt] = file.createdAt
        }
    }

    fun findById(id: String): FileRecord? = transaction {
        FilesTable.selectAll().where { FilesTable.id eq id }
            .limit(1)
            .firstOrNull()
            ?.toFile()
    }

    fun findByOwner(ownerId: String): List<FileRecord> = transaction {
        FilesTable.selectAll()
            .where { FilesTable.ownerId eq ownerId }
            .orderBy(FilesTable.createdAt to SortOrder.DESC)
            .map { it.toFile() }
    }
}

class ShareRepository {
    fun create(share: ShareLink) = transaction {
        SharesTable.insert {
            it[token] = share.token
            it[fileId] = share.fileId
            it[expireAt] = share.expireAt
            it[allowDownload] = share.allowDownload
            it[accessCodeHash] = share.accessCodeHash
            it[createdAt] = Instant.now()
        }
    }

    fun findByToken(token: String): ShareLink? = transaction {
        SharesTable.selectAll().where { SharesTable.token eq token }
            .limit(1)
            .firstOrNull()
            ?.toShare()
    }
}

private fun ResultRow.toUser(): User =
    User(
        id = this[UsersTable.id],
        account = this[UsersTable.account],
        passwordHash = this[UsersTable.passwordHash],
    )

private fun ResultRow.toFile(): FileRecord =
    FileRecord(
        id = this[FilesTable.id],
        ownerId = this[FilesTable.ownerId],
        name = this[FilesTable.name],
        size = this[FilesTable.size],
        storageKey = this[FilesTable.storageKey],
        createdAt = this[FilesTable.createdAt],
    )

private fun ResultRow.toShare(): ShareLink =
    ShareLink(
        token = this[SharesTable.token],
        fileId = this[SharesTable.fileId],
        expireAt = this[SharesTable.expireAt],
        allowDownload = this[SharesTable.allowDownload],
        accessCodeHash = this[SharesTable.accessCodeHash],
    )
