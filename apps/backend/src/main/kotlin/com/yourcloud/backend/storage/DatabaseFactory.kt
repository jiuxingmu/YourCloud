package com.yourcloud.backend.storage

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {
    fun initFromEnv() {
        val url = System.getenv("DB_URL") ?: "jdbc:postgresql://localhost:5432/yourcloud"
        val user = System.getenv("DB_USER") ?: "yourcloud"
        val password = System.getenv("DB_PASSWORD") ?: "yourcloud"

        val hikari = HikariConfig().apply {
            jdbcUrl = url
            username = user
            this.password = password
            driverClassName = "org.postgresql.Driver"
            maximumPoolSize = 5
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }

        Database.connect(HikariDataSource(hikari))
        transaction {
            SchemaUtils.create(UsersTable, FilesTable, SharesTable)
        }
    }
}
