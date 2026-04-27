plugins {
    kotlin("multiplatform") version "2.0.21" apply false
    kotlin("jvm") version "2.0.21" apply false
    kotlin("plugin.serialization") version "2.0.21" apply false
    id("io.ktor.plugin") version "2.3.12" apply false
}

allprojects {
    repositories {
        mavenCentral()
    }
}
