package com.chase.miredgains.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.chase.miredgains.ui.theme.*

private val MUSCLE_GROUPS = listOf(
    "Back", "Chest", "Shoulders", "Biceps", "Triceps",
    "Legs", "Core", "Glutes", "Calves", "Cardio", "Other"
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AddExerciseDialog(
    onDismiss: () -> Unit,
    onSave: (name: String, group: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var selectedGroup by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f)
                .padding(top = 24.dp),
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
            color = BgCard
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "New Exercise",
                        style = Typography.titleLarge,
                        color = TextPrimary
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "EXERCISE NAME",
                    style = Typography.labelSmall,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(8.dp))
                TextField(
                    value = name,
                    onValueChange = { name = it; error = null },
                    placeholder = { Text("e.g. Cable Fly", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = BgInput,
                        unfocusedContainerColor = BgInput,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    shape = RoundedCornerShape(10.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "MUSCLE GROUP",
                    style = Typography.labelSmall,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(12.dp))
                
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    MUSCLE_GROUPS.forEach { group ->
                        val isSelected = selectedGroup == group
                        Surface(
                            modifier = Modifier.clickable { selectedGroup = group; error = null },
                            shape = RoundedCornerShape(100.dp),
                            color = if (isSelected) EmeraldBg else BgElevated,
                            border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, Emerald) else null
                        ) {
                            Text(
                                text = group,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                style = Typography.bodyMedium,
                                color = if (isSelected) Emerald else TextSecondary,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }

                error?.let {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(it, color = Danger, style = Typography.labelSmall)
                }

                Spacer(modifier = Modifier.weight(1f))

                Button(
                    onClick = {
                        if (name.isBlank()) {
                            error = "Exercise name is required."
                            return@Button
                        }
                        if (selectedGroup.isBlank()) {
                            error = "Select a muscle group."
                            return@Button
                        }
                        onSave(name.trim(), selectedGroup)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald)
                ) {
                    Text("Save Exercise", color = Color.White, modifier = Modifier.padding(vertical = 8.dp))
                }
            }
        }
    }
}
