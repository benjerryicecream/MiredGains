package com.chase.miredgains.ui.screens

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Server
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.chase.miredgains.ui.AppViewModel
import com.chase.miredgains.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*

private const val SYNC_ADDR_KEY = "mg_sync_address"
private const val LAST_SYNC_KEY = "mg_last_sync"
private const val DEFAULT_ADDR = "192.168.5.24:8500"

@Composable
fun SyncScreen(viewModel: AppViewModel) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("miredgains", Context.MODE_PRIVATE) }
    val scope = rememberCoroutineScope()

    val workouts by viewModel.allWorkouts.collectAsState(initial = emptyList())
    val bodyweights by viewModel.allBodyweightEntries.collectAsState(initial = emptyList())
    val exercises by viewModel.allExercises.collectAsState(initial = emptyList())

    var address by remember { mutableStateOf(prefs.getString(SYNC_ADDR_KEY, "") ?: "") }
    var lastSync by remember { mutableStateOf(prefs.getString(LAST_SYNC_KEY, "") ?: "") }
    var status by remember { mutableStateOf("idle") }

    val dateFormat = remember { SimpleDateFormat("MMM d, h:mm a", Locale.getDefault()) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg)
    ) {
        Text(
            text = "Sync",
            style = Typography.titleLarge,
            color = TextPrimary,
            modifier = Modifier.padding(16.dp)
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Intro card
            Card(
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderSubtle),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .background(EmeraldBg, RoundedCornerShape(20.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.PhoneAndroid,
                            contentDescription = null,
                            tint = Emerald,
                            modifier = Modifier.size(40.dp)
                        )
                    }
                    Text("Desktop Sync", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text(
                        "Keep workouts, body weight, and scheduled sessions identical on your phone and desktop. Syncing merges both sides.",
                        style = Typography.bodySmall,
                        color = TextSecondary,
                        textAlign = TextAlign.Center,
                        lineHeight = 19.sp
                    )
                }
            }

            // Address input
            OutlinedTextField(
                value = address,
                onValueChange = { address = it },
                label = { Text("DESKTOP ADDRESS") },
                placeholder = { Text(DEFAULT_ADDR) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Emerald,
                    unfocusedBorderColor = Border,
                    focusedLabelColor = Emerald,
                    unfocusedLabelColor = TextMuted,
                    cursorColor = Emerald
                )
            )

            // Sync button
            Button(
                onClick = {
                    val addr = (address.ifBlank { DEFAULT_ADDR })
                        .replace(Regex("^https?://"), "")
                        .replace(Regex("/$"), "")
                    if (addr.isBlank()) return@Button

                    status = "busy"
                    scope.launch {
                        try {
                            val result = withContext(Dispatchers.IO) {
                                syncWithServer(addr, workouts, bodyweights, exercises)
                            }
                            lastSync = Date().toInstant().toString()
                            prefs.edit()
                                .putString(LAST_SYNC_KEY, lastSync)
                                .putString(SYNC_ADDR_KEY, addr)
                                .apply()
                            status = "ok"
                        } catch (e: Exception) {
                            status = "error"
                        }
                    }
                },
                enabled = status != "busy",
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Emerald)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        if (status == "busy") "Syncing…" else "Sync Now",
                        fontWeight = FontWeight.Bold
                    )
            }

            // Status
            if (status == "ok" || status == "error") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (status == "ok") {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        val syncText = if (lastSync.isNotBlank()) {
                            try {
                                val syncDate = Date.from(java.time.Instant.parse(lastSync))
                                "Synced · ${dateFormat.format(syncDate)}"
                            } catch (_: Exception) {
                                "Synced"
                            }
                        } else "Synced"
                        Text(syncText, fontWeight = FontWeight.SemiBold, color = Emerald)
                    } else {
                        Icon(Icons.Default.Close, contentDescription = null, tint = Danger, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Couldn't reach the desktop server", fontWeight = FontWeight.SemiBold, color = Danger)
                    }
                }
            }

            // How it works
            Card(
                colors = CardDefaults.cardColors(containerColor = BgCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderSubtle),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Default.Server, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(14.dp))
                        Text("HOW IT WORKS", style = Typography.labelSmall, color = TextSecondary, fontWeight = FontWeight.Bold, letterSpacing = 0.8.sp)
                    }
                    HelpText("1. On your PC, double-click desktop\\start-desktop.bat (or run node desktop/server.mjs).")
                    HelpText("2. Open the desktop app at http://localhost:8500.")
                    HelpText("3. Connect your phone to the same Wi-Fi, then enter the PC's address here and tap Sync Now.")
                    Text(
                        "The desktop app picks up changes automatically. On your phone, tap Sync Now to pull and push. Deleting items on one device will not delete them on the other.",
                        style = Typography.labelSmall,
                        color = TextMuted,
                        lineHeight = 18.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun HelpText(text: String) {
    Text(text, style = Typography.bodySmall, color = TextSecondary, lineHeight = 20.sp)
}

private fun syncWithServer(
    addr: String,
    workouts: List<com.chase.miredgains.data.WorkoutWithDetails>,
    bodyweights: List<com.chase.miredgains.data.BodyweightEntry>,
    exercises: List<com.chase.miredgains.data.Exercise>
): String {
    val json = JSONObject().apply {
        put("workouts", JSONArray().apply {
            workouts.forEach { w ->
                put(JSONObject().apply {
                    put("id", w.workout.id)
                    put("date", w.workout.date)
                    put("durationMs", w.workout.durationMs)
                    put("notes", w.workout.notes ?: JSONObject.NULL)
                    put("exercises", JSONArray().apply {
                        w.exercises.forEach { ex ->
                            put(JSONObject().apply {
                                put("exerciseId", ex.exercise.exerciseId)
                                put("exerciseName", ex.exercise.exerciseName)
                                put("order", ex.exercise.order)
                                put("sets", JSONArray().apply {
                                    ex.sets.forEach { s ->
                                        put(JSONObject().apply {
                                            put("id", s.id)
                                            put("weight", s.weight.toDouble())
                                            put("reps", s.reps)
                                            put("completed", s.completed)
                                            put("order", s.order)
                                        })
                                    }
                                })
                            })
                        }
                    })
                })
            }
        })
        put("bodyweights", JSONArray().apply {
            bodyweights.forEach { bw ->
                put(JSONObject().apply {
                    put("id", bw.entryDate)
                    put("date", bw.entryDate)
                    put("weight", bw.weight.toDouble())
                })
            }
        })
        put("exercises", JSONArray().apply {
            exercises.forEach { ex ->
                put(JSONObject().apply {
                    put("id", ex.id)
                    put("name", ex.name)
                    put("muscleGroup", ex.muscleGroup)
                })
            }
        })
    }

    val url = URL("http://$addr/api/state")
    val conn = (url.openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        setRequestProperty("Content-Type", "application/json")
        connectTimeout = 10000
        readTimeout = 10000
        doOutput = true
    }
    conn.outputStream.use { os ->
        OutputStreamWriter(os).use { it.write(json.toString()) }
    }

    if (conn.responseCode != 200) {
        throw Exception("Server responded ${conn.responseCode}")
    }

    val body = BufferedReader(InputStreamReader(conn.inputStream)).use { it.readText() }
    conn.disconnect()
    return body
}
