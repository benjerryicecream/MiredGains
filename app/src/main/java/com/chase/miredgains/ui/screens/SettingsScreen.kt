package com.chase.miredgains.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.chase.miredgains.ui.AppViewModel
import com.chase.miredgains.ui.theme.*

@Composable
fun SettingsScreen(viewModel: AppViewModel) {
    val workouts by viewModel.allWorkouts.collectAsState(initial = emptyList())
    val bodyweights by viewModel.allBodyweightEntries.collectAsState(initial = emptyList())
    val exercises by viewModel.allExercises.collectAsState(initial = emptyList())
    var showClearDataDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg)
    ) {
        Text(
            text = "Settings",
            style = Typography.titleLarge,
            color = TextPrimary,
            modifier = Modifier.padding(16.dp)
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Preferences Section
            SettingsSection(label = "PREFERENCES") {
                SettingsRow(
                    icon = Icons.Default.Person,
                    iconColor = Color(0xFF3B82F6),
                    label = "Weight Unit",
                    value = "LBS",
                    onClick = { /* Toggle unit */ }
                )
            }

            // Statistics Section
            SettingsSection(label = "STATISTICS") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatCard(value = workouts.size.toString(), label = "Workouts", modifier = Modifier.weight(1f))
                    StatCard(value = bodyweights.size.toString(), label = "Weight Logs", modifier = Modifier.weight(1f))
                    StatCard(value = exercises.size.toString(), label = "Exercises", modifier = Modifier.weight(1f))
                }
            }

            // Danger Zone
            SettingsSection(label = "DANGER ZONE") {
                SettingsRow(
                    icon = Icons.Default.Delete,
                    iconColor = Danger,
                    label = "Clear All Data",
                    labelColor = Danger,
                    onClick = { showClearDataDialog = true }
                )
            }

            // About Section
            SettingsSection(label = "ABOUT") {
                SettingsRow(
                    icon = Icons.Default.Info,
                    iconColor = TextSecondary,
                    label = "Version",
                    value = "1.0.0"
                )
            }

            Text(
                text = "Made for those who want to track gains without the fluff.",
                style = Typography.labelSmall,
                color = TextMuted,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 20.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                lineHeight = 18.sp
            )
        }
    }

    if (showClearDataDialog) {
        AlertDialog(
            onDismissRequest = { showClearDataDialog = false },
            containerColor = BgCard,
            title = { Text("Clear All Data", fontWeight = FontWeight.Bold) },
            text = { Text("This will permanently delete all your workouts and weight logs. Your custom exercises will be kept.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.clearAllData()
                        showClearDataDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Danger)
                ) {
                    Text("Delete Everything")
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearDataDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }
}

@Composable
fun SettingsSection(label: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = label,
            style = Typography.labelSmall,
            color = TextMuted,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(start = 4.dp)
        )
        content()
    }
}

@Composable
fun SettingsRow(
    icon: ImageVector,
    iconColor: Color,
    label: String,
    labelColor: Color = TextPrimary,
    value: String? = null,
    onClick: (() -> Unit)? = null
) {
    Surface(
        onClick = onClick ?: {},
        enabled = onClick != null,
        color = BgCard,
        shape = RoundedCornerShape(14.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderSubtle),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .background(iconColor.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(20.dp))
                }
                Text(text = label, style = Typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = labelColor)
            }
            
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (value != null) {
                    Text(text = value, style = Typography.bodySmall, color = TextSecondary)
                }
                if (onClick != null) {
                    Icon(Icons.Default.KeyboardArrowRight, contentDescription = null, tint = TextMuted, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

@Composable
fun StatCard(value: String, label: String, modifier: Modifier = Modifier) {
    Surface(
        color = BgCard,
        shape = RoundedCornerShape(14.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderSubtle),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(text = value, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = Emerald)
            Text(text = label.uppercase(), style = Typography.labelSmall, color = TextSecondary, fontWeight = FontWeight.Bold)
        }
    }
}
