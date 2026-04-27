package com.yourcloud.backend.storage

import com.yourcloud.backend.model.FileRecord
import com.yourcloud.backend.model.ShareLink
import com.yourcloud.backend.model.User
import java.util.concurrent.ConcurrentHashMap

class InMemoryStore {
    val users = ConcurrentHashMap<String, User>()
    val usersByAccount = ConcurrentHashMap<String, String>()
    val files = ConcurrentHashMap<String, FileRecord>()
    val shares = ConcurrentHashMap<String, ShareLink>()
}
