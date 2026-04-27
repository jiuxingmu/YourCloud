package com.yourcloud.backend

import com.yourcloud.backend.model.FileRecord
import com.yourcloud.backend.model.User
import com.yourcloud.backend.service.AuthService
import com.yourcloud.backend.service.ShareService
import com.yourcloud.backend.storage.DatabaseFactory
import com.yourcloud.backend.storage.FileRepository
import com.yourcloud.backend.storage.LocalFileStorage
import com.yourcloud.backend.storage.ShareRepository
import com.yourcloud.backend.storage.UserRepository
import com.yourcloud.shared.AuthRequest
import com.yourcloud.shared.AuthResponse
import com.yourcloud.shared.FileItem
import com.yourcloud.shared.ShareCreateRequest
import com.yourcloud.shared.ShareCreateResponse
import com.yourcloud.shared.ShareDownloadRequest
import io.ktor.http.ContentDisposition
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.callloging.CallLogging
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.request.receive
import io.ktor.server.request.receiveStream
import io.ktor.server.response.header
import io.ktor.server.response.respond
import io.ktor.server.response.respondBytes
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.Instant
import java.util.UUID

fun main() {
    embeddedServer(Netty, port = 8080, module = Application::module).start(wait = true)
}

fun Application.module() {
    DatabaseFactory.initFromEnv()
    val authService = AuthService(System.getenv("JWT_SECRET") ?: "dev-secret")
    val shareService = ShareService()
    val userRepository = UserRepository()
    val fileRepository = FileRepository()
    val shareRepository = ShareRepository()
    val localStorage = LocalFileStorage(System.getenv("UPLOAD_DIR") ?: "uploads")

    install(CallLogging)
    install(ContentNegotiation) {
        json()
    }
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.ContentType)
        allowMethod(io.ktor.http.HttpMethod.Get)
        allowMethod(io.ktor.http.HttpMethod.Post)
    }
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respond(
                HttpStatusCode.InternalServerError,
                mapOf("message" to normalizeErrorMessage(cause)),
            )
        }
    }

    routing {
        post("/api/auth/register") {
            val req = call.receive<AuthRequest>()
            if (userRepository.existsByAccount(req.account)) {
                call.respond(HttpStatusCode.Conflict, mapOf("message" to "账号已存在"))
                return@post
            }
            val userId = UUID.randomUUID().toString()
            val user = User(
                id = userId,
                account = req.account,
                passwordHash = authService.hashPassword(req.password),
            )
            userRepository.create(user)
            call.respond(HttpStatusCode.Created)
        }

        post("/api/auth/login") {
            val req = call.receive<AuthRequest>()
            val user = userRepository.findByAccount(req.account)
            if (user == null || !authService.verifyPassword(req.password, user.passwordHash)) {
                call.respond(HttpStatusCode.Unauthorized, mapOf("message" to "账号或密码错误"))
                return@post
            }
            call.respond(AuthResponse(authService.issueAccessToken(user.id)))
        }

        post("/api/files/upload") {
            val currentUserId = call.requireUserId(authService) ?: return@post
            val originalName = call.request.queryParameters["name"] ?: "upload.bin"
            val uploadResult = withContext(Dispatchers.IO) {
                val key = localStorage.save(originalName, call.receiveStream())
                val localFile = localStorage.open(key)
                key to localFile.length()
            }
            val record = FileRecord(
                id = UUID.randomUUID().toString(),
                ownerId = currentUserId,
                name = originalName,
                size = uploadResult.second,
                storageKey = uploadResult.first,
                createdAt = Instant.now(),
            )
            fileRepository.create(record)
            call.respond(
                FileItem(
                    id = record.id,
                    name = record.name,
                    size = record.size,
                    createdAt = record.createdAt.toString(),
                ),
            )
        }

        get("/api/files") {
            val currentUserId = call.requireUserId(authService) ?: return@get
            val items = fileRepository.findByOwner(currentUserId)
                .map {
                    FileItem(
                        id = it.id,
                        name = it.name,
                        size = it.size,
                        createdAt = it.createdAt.toString(),
                    )
                }
            call.respond(items)
        }

        get("/api/files/{id}/download") {
            val currentUserId = call.requireUserId(authService, allowQueryToken = true) ?: return@get
            val fileId = call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest)
            val file = fileRepository.findById(fileId) ?: return@get call.respond(HttpStatusCode.NotFound)
            if (file.ownerId != currentUserId) {
                call.respond(HttpStatusCode.Forbidden)
                return@get
            }
            val localFile = localStorage.open(file.storageKey)
            if (!localFile.exists()) {
                call.respond(HttpStatusCode.NotFound)
                return@get
            }

            call.response.header(
                HttpHeaders.ContentDisposition,
                ContentDisposition.Attachment.withParameter(ContentDisposition.Parameters.FileName, file.name).toString(),
            )
            call.respondBytes(localFile.readBytes(), ContentType.Application.OctetStream)
        }

        post("/api/shares") {
            val currentUserId = call.requireUserId(authService) ?: return@post
            val req = call.receive<ShareCreateRequest>()
            val file = fileRepository.findById(req.fileId) ?: return@post call.respond(HttpStatusCode.NotFound)
            if (file.ownerId != currentUserId) {
                call.respond(HttpStatusCode.Forbidden)
                return@post
            }
            val share = shareService.createShare(
                fileId = req.fileId,
                expireAt = Instant.ofEpochSecond(req.expireAtEpochSeconds),
                allowDownload = true,
                accessCode = req.accessCode,
            )
            shareRepository.create(share)
            call.respond(
                ShareCreateResponse(
                    token = share.token,
                    url = "/s/${share.token}",
                ),
            )
        }

        get("/s/{token}") {
            val token = call.parameters["token"] ?: return@get call.respond(HttpStatusCode.BadRequest)
            val share = shareRepository.findByToken(token) ?: return@get call.respond(HttpStatusCode.NotFound)
            val file = fileRepository.findById(share.fileId) ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(
                mapOf(
                    "fileId" to file.id,
                    "name" to file.name,
                    "expireAt" to share.expireAt.toString(),
                    "needAccessCode" to (share.accessCodeHash != null).toString(),
                ),
            )
        }

        post("/s/{token}/download") {
            val token = call.parameters["token"] ?: return@post call.respond(HttpStatusCode.BadRequest)
            val req = call.receive<ShareDownloadRequest>()
            val share = shareRepository.findByToken(token) ?: return@post call.respond(HttpStatusCode.NotFound)
            val decision = shareService.validateAccess(share, req.accessCode)
            if (!decision.allowed) {
                call.respond(HttpStatusCode.Forbidden, mapOf("message" to (decision.reason ?: "无访问权限")))
                return@post
            }
            val file = fileRepository.findById(share.fileId) ?: return@post call.respond(HttpStatusCode.NotFound)
            val localFile = localStorage.open(file.storageKey)
            if (!localFile.exists()) {
                call.respond(HttpStatusCode.NotFound)
                return@post
            }
            call.response.header(
                HttpHeaders.ContentDisposition,
                ContentDisposition.Attachment.withParameter(ContentDisposition.Parameters.FileName, file.name).toString(),
            )
            call.respondBytes(localFile.readBytes(), ContentType.Application.OctetStream)
        }

        get("/s/{token}/download") {
            val token = call.parameters["token"] ?: return@get call.respond(HttpStatusCode.BadRequest)
            val accessCode = call.request.queryParameters["accessCode"]
            val share = shareRepository.findByToken(token) ?: return@get call.respond(HttpStatusCode.NotFound)
            val decision = shareService.validateAccess(share, accessCode)
            if (!decision.allowed) {
                call.respond(HttpStatusCode.Forbidden, mapOf("message" to (decision.reason ?: "无访问权限")))
                return@get
            }
            val file = fileRepository.findById(share.fileId) ?: return@get call.respond(HttpStatusCode.NotFound)
            val localFile = localStorage.open(file.storageKey)
            if (!localFile.exists()) {
                call.respond(HttpStatusCode.NotFound)
                return@get
            }
            call.response.header(
                HttpHeaders.ContentDisposition,
                ContentDisposition.Attachment.withParameter(ContentDisposition.Parameters.FileName, file.name).toString(),
            )
            call.respondBytes(localFile.readBytes(), ContentType.Application.OctetStream)
        }
    }
}

internal fun normalizeErrorMessage(cause: Throwable): String {
    val raw = cause.message?.trim().orEmpty()
    return if (raw.isBlank()) "服务器内部错误，请稍后再试" else raw
}

private suspend fun io.ktor.server.application.ApplicationCall.requireUserId(
    authService: AuthService,
    allowQueryToken: Boolean = false,
): String? {
    val bearerToken = request.headers[HttpHeaders.Authorization]
        ?.takeIf { it.startsWith("Bearer ") }
        ?.removePrefix("Bearer ")
        ?.trim()
    val queryToken = if (allowQueryToken) request.queryParameters["token"] else null
    val token = bearerToken ?: queryToken
    if (token.isNullOrBlank()) {
        respond(HttpStatusCode.Unauthorized, mapOf("message" to "缺少登录凭证"))
        return null
    }
    return runCatching {
        authService.verifyAndExtractUserId(token)
    }.getOrElse {
        respond(HttpStatusCode.Unauthorized, mapOf("message" to "登录凭证无效"))
        null
    }
}
