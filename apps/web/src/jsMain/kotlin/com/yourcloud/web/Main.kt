package com.yourcloud.web

import com.yourcloud.shared.AuthRequest
import com.yourcloud.shared.AuthResponse
import com.yourcloud.shared.FileItem
import com.yourcloud.shared.ShareCreateRequest
import com.yourcloud.shared.ShareCreateResponse
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.js.Js
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.browser.document
import kotlinx.browser.window
import kotlinx.coroutines.await
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.w3c.dom.HTMLButtonElement
import org.w3c.dom.HTMLInputElement
import org.w3c.files.File
import kotlin.js.Promise

private const val API_BASE = "http://localhost:8080"
private const val UPLOAD_TIMEOUT_MS = 30_000
private const val MAX_UPLOAD_ATTEMPTS = 3
private const val RETRY_DELAY_MS = 1_000L
private val scope: CoroutineScope = MainScope()
private val client = HttpClient(Js) {
    install(ContentNegotiation) { json() }
    defaultRequest {
        url(API_BASE)
    }
}

private var token: String? = null
private var uploading = false
private var uploadCancelled = false
private var activeUploadXhr: dynamic = null
private var latestShareToken: String? = null

fun main() {
    window.onhashchange = {
        render()
    }
    render()
}

private fun render() {
    val root = document.getElementById("root") ?: return
    val shareTokenFromRoute = parseShareTokenFromHash()
    if (shareTokenFromRoute != null) {
        renderShareRoute(root, shareTokenFromRoute)
        bindShareRouteEvents()
        scope.launch { previewSharedFile(tokenOverride = shareTokenFromRoute) }
        return
    }

    root.innerHTML = """
        <div style="font-family: sans-serif; max-width: 860px; margin: 24px auto;">
          <h2 style="margin-bottom:8px;">YourCloud Web MVP</h2>
          <p style="color:#666;margin-top:0;">登录 -> 上传 -> 列表 -> 下载 -> 分享</p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f7f7f8;padding:12px;border-radius:10px;">
            <input id="accountInput" placeholder="账号（例如 demo）" style="padding:10px;border:1px solid #ddd;border-radius:8px;" />
            <input id="passwordInput" type="password" placeholder="密码（例如 demo）" style="padding:10px;border:1px solid #ddd;border-radius:8px;" />
            <button id="registerBtn" style="padding:10px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;">注册</button>
            <button id="loginBtn" style="padding:10px;border-radius:8px;border:0;background:#111;color:white;cursor:pointer;">登录</button>
          </div>

          <div style="margin-top:14px;display:flex;gap:10px;align-items:center;">
            <input id="fileInput" type="file" />
            <button id="uploadBtn" style="padding:8px 12px;border-radius:8px;border:0;background:#111;color:white;cursor:pointer;">上传</button>
            <button id="cancelUploadBtn" style="display:none;padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;">取消上传</button>
            <button id="refreshBtn" style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;">刷新列表</button>
          </div>

          <div style="margin-top:12px;display:flex;gap:10px;align-items:center;background:#f7f7f8;padding:12px;border-radius:10px;">
            <input id="shareTokenInput" placeholder="分享 token" style="padding:8px;border:1px solid #ddd;border-radius:8px;min-width:220px;" />
            <input id="shareCodeInput" placeholder="提取码（可选）" style="padding:8px;border:1px solid #ddd;border-radius:8px;min-width:140px;" />
            <button id="previewShareBtn" style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;">查看分享</button>
            <button id="downloadShareBtn" style="padding:8px 12px;border-radius:8px;border:0;background:#111;color:white;cursor:pointer;">分享下载</button>
          </div>
          <div id="sharePreview" style="margin-top:8px;color:#444;"></div>
          <div style="margin-top:8px;">
            <button id="openShareRouteBtn" style="display:none;padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;">打开分享访问页</button>
          </div>

          <div style="margin-top:16px;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="text-align:left;border-bottom:1px solid #e5e5e5;">
                  <th style="padding:8px;">文件名</th>
                  <th style="padding:8px;">大小</th>
                  <th style="padding:8px;">时间</th>
                  <th style="padding:8px;">操作</th>
                </tr>
              </thead>
              <tbody id="fileTableBody"></tbody>
            </table>
          </div>

          <pre id="output" style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:8px;margin-top:16px;"></pre>
        </div>
    """.trimIndent()

    bindEvents()
}

private fun renderShareRoute(root: org.w3c.dom.Element, tokenFromRoute: String) {
    root.innerHTML = """
        <div style="font-family: sans-serif; max-width: 680px; margin: 24px auto;">
          <h2 style="margin-bottom:8px;">分享访问页</h2>
          <p style="color:#666;margin-top:0;">无需登录即可访问分享文件</p>
          <div style="background:#f7f7f8;padding:12px;border-radius:10px;display:flex;gap:10px;align-items:center;">
            <input id="shareTokenInput" value="$tokenFromRoute" placeholder="分享 token" style="padding:8px;border:1px solid #ddd;border-radius:8px;min-width:220px;" />
            <input id="shareCodeInput" placeholder="提取码（可选）" style="padding:8px;border:1px solid #ddd;border-radius:8px;min-width:140px;" />
            <button id="previewShareBtn" style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;">查看分享</button>
            <button id="downloadShareBtn" style="padding:8px 12px;border-radius:8px;border:0;background:#111;color:white;cursor:pointer;">下载文件</button>
          </div>
          <div id="sharePreview" style="margin-top:10px;color:#444;"></div>
          <div style="margin-top:12px;">
            <a href="#/" style="color:#111;">返回主页面</a>
          </div>
          <pre id="output" style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:8px;margin-top:16px;"></pre>
        </div>
    """.trimIndent()
}

private fun bindEvents() {
    val registerBtn = document.getElementById("registerBtn") as HTMLButtonElement
    val loginBtn = document.getElementById("loginBtn") as HTMLButtonElement
    val uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement
    val cancelUploadBtn = document.getElementById("cancelUploadBtn") as? HTMLButtonElement
    val refreshBtn = document.getElementById("refreshBtn") as HTMLButtonElement
    val previewShareBtn = document.getElementById("previewShareBtn") as HTMLButtonElement
    val downloadShareBtn = document.getElementById("downloadShareBtn") as HTMLButtonElement
    val openShareRouteBtn = document.getElementById("openShareRouteBtn") as? HTMLButtonElement

    registerBtn.onclick = {
        scope.launch { register() }
    }
    loginBtn.onclick = {
        scope.launch { login() }
    }
    uploadBtn.onclick = {
        scope.launch { upload() }
    }
    cancelUploadBtn?.onclick = {
        cancelCurrentUpload()
    }
    refreshBtn.onclick = {
        scope.launch { renderFiles() }
    }
    previewShareBtn.onclick = {
        scope.launch { previewSharedFile() }
    }
    downloadShareBtn.onclick = {
        downloadSharedFile()
    }
    openShareRouteBtn?.onclick = {
        val current = latestShareToken
        if (!current.isNullOrBlank()) {
            window.location.hash = "/share/$current"
        } else {
            setOutput("请先创建分享链接")
        }
    }
}

private fun bindShareRouteEvents() {
    val previewShareBtn = document.getElementById("previewShareBtn") as? HTMLButtonElement
    val downloadShareBtn = document.getElementById("downloadShareBtn") as? HTMLButtonElement
    previewShareBtn?.onclick = {
        scope.launch { previewSharedFile() }
    }
    downloadShareBtn?.onclick = {
        downloadSharedFile()
    }
}

private suspend fun register() {
    val account = inputValue("accountInput")
    val password = inputValue("passwordInput")
    runCatching {
        client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(AuthRequest(account, password))
        }
    }.onSuccess {
        setOutput("注册成功，请点击登录")
    }.onFailure {
        setOutput("注册失败：${it.message}")
    }
}

private suspend fun login() {
    val account = inputValue("accountInput")
    val password = inputValue("passwordInput")
    runCatching {
        client.post("/api/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(AuthRequest(account, password))
        }.body<AuthResponse>()
    }.onSuccess {
        token = it.token
        setOutput("登录成功")
        renderFiles()
    }.onFailure {
        setOutput("登录失败：${it.message}")
    }
}

private suspend fun upload() {
    if (uploading) {
        setOutput("上传进行中，请稍候")
        return
    }
    val fileInput = document.getElementById("fileInput") as HTMLInputElement
    val file = fileInput.files?.item(0)
    if (file == null) {
        setOutput("请先选择文件")
        return
    }
    if (token.isNullOrBlank()) {
        setOutput("请先登录")
        return
    }

    uploading = true
    uploadCancelled = false
    setOutput("正在上传：${file.name} ...")
    setUploadButtonEnabled(false)
    setCancelUploadButtonVisible(true)
    runCatching {
        uploadFile(file)
        uploadWithRetry(file)
    }.onSuccess {
        setOutput("上传成功：${file.name}")
        renderFiles()
    }.onFailure {
        if (it is UploadCancelledException) {
            setOutput("已取消上传")
        } else {
            setOutput("上传失败：${it.message}")
        }
    }.also {
        uploading = false
        setUploadButtonEnabled(true)
        setCancelUploadButtonVisible(false)
        activeUploadXhr = null
    }
}

private suspend fun renderFiles() {
    if (token.isNullOrBlank()) {
        return
    }
    val tbody = document.getElementById("fileTableBody") ?: return
    runCatching {
        client.get("/api/files") {
            headers.append("Authorization", "Bearer $token")
        }.body<List<FileItem>>()
    }.onSuccess { files ->
        tbody.innerHTML = ""
        files.forEach { file ->
            val tr = document.createElement("tr")
            tr.innerHTML = """
              <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${file.name}</td>
              <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${file.size}</td>
              <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${file.createdAt}</td>
              <td style="padding:8px;border-bottom:1px solid #f0f0f0;">
                <button data-download="${file.id}" style="margin-right:8px;padding:6px 10px;border:1px solid #ddd;background:white;border-radius:6px;cursor:pointer;">下载</button>
                <button data-share="${file.id}" style="padding:6px 10px;border:0;background:#111;color:white;border-radius:6px;cursor:pointer;">分享</button>
              </td>
            """.trimIndent()
            tbody.appendChild(tr)
        }
        bindTableActions()
        setOutput("文件数：${files.size}")
    }.onFailure {
        setOutput("加载文件失败：${it.message}")
    }
}

private fun bindTableActions() {
    document.querySelectorAll("button[data-download]").asList().forEach { node ->
        (node as HTMLButtonElement).onclick = {
            val fileId = node.getAttribute("data-download")
            if (fileId != null) {
                downloadFile(fileId)
            }
        }
    }
    document.querySelectorAll("button[data-share]").asList().forEach { node ->
        (node as HTMLButtonElement).onclick = {
            val fileId = node.getAttribute("data-share")
            if (fileId != null) {
                scope.launch { createShare(fileId) }
            }
        }
    }
}

private fun downloadFile(fileId: String) {
    val current = token
    if (current.isNullOrBlank()) {
        setOutput("请先登录")
        return
    }
    window.open("$API_BASE/api/files/$fileId/download?token=$current", "_blank")
}

private suspend fun createShare(fileId: String) {
    if (token.isNullOrBlank()) return
    val expire = (kotlin.js.Date().getTime() / 1000).toLong() + 3600
    runCatching {
        client.post("/api/shares") {
            headers.append("Authorization", "Bearer $token")
            contentType(ContentType.Application.Json)
            setBody(
                ShareCreateRequest(
                    fileId = fileId,
                    expireAtEpochSeconds = expire,
                    accessCode = "1234",
                ),
            )
        }.body<ShareCreateResponse>()
    }.onSuccess {
        val link = "$API_BASE${it.url}"
        val tokenInput = document.getElementById("shareTokenInput") as HTMLInputElement
        tokenInput.value = it.token
        latestShareToken = it.token
        setOpenShareRouteButtonVisible(true)
        window.navigator.clipboard?.writeText(link)
        setOutput("分享链接已生成并尝试复制（提取码 1234）：$link")
    }.onFailure {
        setOutput("创建分享失败：${it.message}")
    }
}

private suspend fun previewSharedFile(tokenOverride: String? = null) {
    val shareToken = tokenOverride ?: inputValue("shareTokenInput")
    if (shareToken.isBlank()) {
        setOutput("请先输入分享 token")
        return
    }
    val preview = document.getElementById("sharePreview") ?: return
    runCatching {
        val response = window.fetch("$API_BASE/s/$shareToken").await()
        if (!response.ok) {
            val bodyText = response.text().await()
            val reason = when (response.status.toInt()) {
                404 -> "分享不存在或已失效"
                403 -> "当前分享不可访问"
                410 -> "分享已过期"
                else -> bodyText.takeIf { it.isNotBlank() } ?: "HTTP ${response.status}"
            }
            error(reason)
        }
        response.text().await()
    }.onSuccess { info ->
        val payload = Json.parseToJsonElement(info).jsonObject
        val name = payload["name"]?.jsonPrimitive?.content ?: "-"
        val expireAt = payload["expireAt"]?.jsonPrimitive?.content ?: "-"
        val needCode = (payload["needAccessCode"]?.jsonPrimitive?.content ?: "false").equals("true", ignoreCase = true)
        val needCodeText = if (needCode) "是" else "否"
        preview.textContent = "分享文件：$name，过期时间：$expireAt，需要提取码：$needCodeText"
        setOutput("分享信息获取成功")
    }.onFailure { error ->
        preview.textContent = ""
        setOutput("分享信息获取失败：${error.message}")
    }
}

private fun downloadSharedFile() {
    val shareToken = inputValue("shareTokenInput")
    if (shareToken.isBlank()) {
        setOutput("请先输入分享 token")
        return
    }
    val accessCode = inputValue("shareCodeInput")
    val url = if (accessCode.isBlank()) {
        "$API_BASE/s/$shareToken/download"
    } else {
        "$API_BASE/s/$shareToken/download?accessCode=$accessCode"
    }
    window.open(url, "_blank")
}

private suspend fun uploadFile(file: File) {
    // Reserved hook for future chunk upload / progress API.
}

private suspend fun uploadWithRetry(file: File) {
    var lastError: Throwable? = null
    for (attempt in 1..MAX_UPLOAD_ATTEMPTS) {
        if (uploadCancelled) {
            throw UploadCancelledException()
        }
        runCatching {
            uploadWithXhr(file, attempt, MAX_UPLOAD_ATTEMPTS)
        }.onSuccess {
            return
        }.onFailure { error ->
            lastError = error
            if (error is UploadCancelledException) {
                throw error
            }
            if (attempt < MAX_UPLOAD_ATTEMPTS) {
                setOutput("上传失败（第 $attempt/$MAX_UPLOAD_ATTEMPTS 次）：${error.message}，准备重试...")
                delay(RETRY_DELAY_MS)
            }
        }
    }
    throw (lastError ?: IllegalStateException("上传失败：未知错误"))
}

private suspend fun uploadWithXhr(file: File, attempt: Int, maxAttempts: Int) {
    val currentToken = token ?: error("请先登录")
    val encodedName = js("encodeURIComponent")(file.name) as String
    val url = "$API_BASE/api/files/upload?name=$encodedName"

    Promise<Unit> { resolve, reject ->
        val xhr = js("new XMLHttpRequest()")
        activeUploadXhr = xhr
        xhr.open("POST", url, true)
        xhr.timeout = UPLOAD_TIMEOUT_MS
        xhr.setRequestHeader("Authorization", "Bearer $currentToken")

        xhr.upload.onprogress = { event: dynamic ->
            if (event.lengthComputable as Boolean) {
                val loaded = (event.loaded as Number).toDouble()
                val total = (event.total as Number).toDouble()
                val percent = ((loaded / total) * 100).toInt().coerceIn(0, 100)
                setOutput("正在上传：${file.name}（第 $attempt/$maxAttempts 次，$percent%）")
            } else {
                setOutput("正在上传：${file.name}（第 $attempt/$maxAttempts 次）")
            }
            Unit
        }

        xhr.onload = {
            val status = (xhr.status as Number).toInt()
            if (status in 200..299) {
                resolve(Unit)
            } else {
                val responseText = (xhr.responseText as? String)?.takeIf { it.isNotBlank() } ?: "无响应体"
                reject(IllegalStateException("HTTP $status: $responseText"))
            }
            Unit
        }

        xhr.onerror = {
            reject(IllegalStateException("网络错误，请检查后端服务是否可用"))
            Unit
        }

        xhr.onabort = {
            reject(UploadCancelledException())
            Unit
        }

        xhr.ontimeout = {
            reject(IllegalStateException("上传超时（${UPLOAD_TIMEOUT_MS / 1000}s）"))
            Unit
        }

        xhr.send(file)
    }.await()
}

private fun cancelCurrentUpload() {
    if (!uploading) return
    uploadCancelled = true
    activeUploadXhr?.abort()
}

private fun inputValue(id: String): String {
    val input = document.getElementById(id) as HTMLInputElement
    return input.value.trim()
}

private fun setOutput(text: String) {
    document.getElementById("output")?.textContent = text
}

private fun setUploadButtonEnabled(enabled: Boolean) {
    val button = document.getElementById("uploadBtn") as? HTMLButtonElement ?: return
    button.disabled = !enabled
    button.style.opacity = if (enabled) "1" else "0.6"
}

private fun setCancelUploadButtonVisible(visible: Boolean) {
    val button = document.getElementById("cancelUploadBtn") as? HTMLButtonElement ?: return
    button.style.display = if (visible) "inline-block" else "none"
}

private fun setOpenShareRouteButtonVisible(visible: Boolean) {
    val button = document.getElementById("openShareRouteBtn") as? HTMLButtonElement ?: return
    button.style.display = if (visible) "inline-block" else "none"
}

private fun parseShareTokenFromHash(): String? {
    val hash = window.location.hash.removePrefix("#")
    val parts = hash.split("/")
    if (parts.size >= 3 && parts[1] == "share") {
        return parts[2].trim().takeIf { it.isNotBlank() }
    }
    return null
}

private fun org.w3c.dom.NodeList.asList(): List<org.w3c.dom.Node> {
    val result = mutableListOf<org.w3c.dom.Node>()
    var index = 0
    while (index < length) {
        item(index)?.let { result.add(it) }
        index += 1
    }
    return result
}

private class UploadCancelledException : RuntimeException("上传已取消")
