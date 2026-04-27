plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
    id("io.ktor.plugin")
    application
}

group = "com.yourcloud"
version = "0.1.0"

application {
    mainClass.set("com.yourcloud.backend.ApplicationKt")
}

dependencies {
    implementation(project(":apps:shared"))

    implementation("io.ktor:ktor-server-core-jvm:2.3.12")
    implementation("io.ktor:ktor-server-netty-jvm:2.3.12")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:2.3.12")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:2.3.12")
    implementation("io.ktor:ktor-server-auth-jvm:2.3.12")
    implementation("io.ktor:ktor-server-auth-jwt-jvm:2.3.12")
    implementation("io.ktor:ktor-server-call-logging-jvm:2.3.12")
    implementation("io.ktor:ktor-server-cors-jvm:2.3.12")
    implementation("io.ktor:ktor-server-status-pages-jvm:2.3.12")

    implementation("org.jetbrains.exposed:exposed-core:0.53.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.53.0")
    implementation("org.jetbrains.exposed:exposed-java-time:0.53.0")
    implementation("com.zaxxer:HikariCP:5.1.0")
    implementation("org.postgresql:postgresql:42.7.4")

    implementation("at.favre.lib:bcrypt:0.10.2")
    implementation("com.auth0:java-jwt:4.4.0")
    implementation("ch.qos.logback:logback-classic:1.5.6")

    testImplementation(kotlin("test"))
    testImplementation("io.ktor:ktor-server-test-host-jvm:2.3.12")
}
