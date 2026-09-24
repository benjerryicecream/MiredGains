package com.chase.miredgains.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.chase.miredgains.data.BodyweightEntry
import com.chase.miredgains.data.WorkoutWithDetails
import com.chase.miredgains.ui.AppViewModel
import com.chase.miredgains.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun HistoryScreen(viewModel: AppViewModel) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var showWeightDialog by remember { mutableStateOf(false) }
    val workouts by viewModel.allWorkouts.collectAsState(initial = emptyList())
    val bodyweights by viewModel.allBodyweightEntries.collectAsState(initial = emptyList())

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                text = "History",
                style = Typography.titleLarge,
                color = TextPrimary,
                modifier = Modifier.padding(16.dp)
            )

            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = BgCard,
                contentColor = Emerald,
                divider = {}
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Workouts") },
                    icon = { Icon(Icons.Default.History, contentDescription = null) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Body Weight") },
                    icon = { Icon(Icons.Default.Person, contentDescription = null) }
                )
            }

            if (selectedTab == 0) {
                WorkoutHistoryList(workouts, onDelete = { viewModel.deleteWorkout(it.workout.id) })
            } else {
                BodyweightHistoryList(bodyweights, viewModel)
            }
        }

        if (selectedTab == 1) {
            FloatingActionButton(
                onClick = { showWeightDialog = true },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp),
                containerColor = Emerald,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Log Weight")
            }
        }
    }

    if (showWeightDialog) {
        LogBodyweightDialog(
            onDismiss = { showWeightDialog = false },
            onConfirm = { weight ->
                val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val currentDate = sdf.format(Date())
                viewModel.upsertBodyweight(currentDate, weight)
            }
        )
    }
}

@Composable
fun LogBodyweightDialog(
    onDismiss: () -> Unit,
    onConfirm: (Float) -> Unit
) {
    var weight by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = BgCard,
        titleContentColor = TextPrimary,
        textContentColor = TextSecondary,
        title = { Text("Log Body Weight", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Enter your current weight in lbs:", style = Typography.bodySmall)
                OutlinedTextField(
                    value = weight,
                    onValueChange = { weight = it },
                    label = { Text("Weight") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Emerald,
                        unfocusedBorderColor = Border,
                        focusedLabelColor = Emerald
                    )
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    weight.toFloatOrNull()?.let { onConfirm(it) }
                    onDismiss()
                },
                enabled = weight.toFloatOrNull() != null,
                colors = ButtonDefaults.buttonColors(containerColor = Emerald)
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = TextSecondary)
            }
        }
    )
}

@Composable
fun WorkoutHistoryList(workouts: List<WorkoutWithDetails>, onDelete: (WorkoutWithDetails) -> Unit) {
    if (workouts.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(48.dp), tint = TextMuted)
                Spacer(modifier = Modifier.height(8.dp))
                Text("No workouts yet", color = TextSecondary)
            }
        }
    } else {
        val sortedWorkouts = remember(workouts) { workouts.sortedByDescending { it.workout.date } }
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(sortedWorkouts) { workout ->
                WorkoutSummaryCard(workout, onDelete = { onDelete(workout) })
            }
        }
    }
}

@Composable
fun WorkoutSummaryCard(workout: WorkoutWithDetails, onDelete: () -> Unit) {
    val dateFormat = remember { SimpleDateFormat("EEE, MMM d, yyyy", Locale.getDefault()) }
    val timeFormat = remember { SimpleDateFormat("h:mm a", Locale.getDefault()) }
    var expanded by remember { mutableStateOf(false) }

    val totalVolume = workout.exercises.sumOf { ex ->
        ex.sets.sumOf { (it.weight * it.reps).toDouble() }
    }
    val totalSets = workout.exercises.sumOf { it.sets.size }
    
    Card(
        modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded },
        colors = CardDefaults.cardColors(containerColor = BgCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderSubtle)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(dateFormat.format(Date(workout.workout.date)), style = Typography.bodyLarge, fontWeight = FontWeight.Bold)
                    Text(timeFormat.format(Date(workout.workout.date)), style = Typography.labelSmall, color = TextSecondary)
                }
                
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    StatPill(value = String.format("%,.0f", totalVolume), label = "lbs vol")
                    StatPill(value = totalSets.toString(), label = "sets")
                    Icon(
                        if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = null,
                        tint = TextMuted,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            if (expanded) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = BorderSubtle)
                Spacer(modifier = Modifier.height(12.dp))
                
                workout.workout.notes?.let {
                    Surface(
                        color = BgElevated,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                    ) {
                        Text(
                            text = it,
                            modifier = Modifier.padding(10.dp),
                            style = Typography.bodySmall,
                            color = TextSecondary,
                            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                        )
                    }
                }

                workout.exercises.forEach { ex ->
                    Column(modifier = Modifier.padding(bottom = 8.dp)) {
                        Text(ex.exercise.exerciseName, style = Typography.bodySmall, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Row(modifier = Modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            ex.sets.forEach { set ->
                                Surface(
                                    color = BgElevated,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = "${set.weight.toInt()}lbs × ${set.reps}",
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                        fontSize = 11.sp,
                                        color = TextSecondary
                                    )
                                }
                            }
                        }
                    }
                }

                TextButton(
                    onClick = onDelete,
                    modifier = Modifier.align(Alignment.Start).padding(top = 4.dp),
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp), tint = Danger)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Delete Workout", color = Danger, style = Typography.labelSmall, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun StatPill(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = Emerald, fontWeight = FontWeight.Bold, style = Typography.bodyMedium)
        Text(label, style = Typography.labelSmall, color = TextMuted)
    }
}

@Composable
fun BodyweightHistoryList(
    entries: List<BodyweightEntry>,
    viewModel: AppViewModel
) {
    if (entries.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(48.dp), tint = TextMuted)
                Spacer(modifier = Modifier.height(8.dp))
                Text("No weight logs yet", color = TextSecondary)
            }
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp)
        ) {
            item { Text("LOG", style = Typography.labelSmall, color = TextMuted, modifier = Modifier.padding(vertical = 8.dp)) }
            items(entries) { entry ->
                BodyweightRow(entry, viewModel)
            }
        }
    }
}

@Composable
fun BodyweightRow(entry: BodyweightEntry, viewModel: AppViewModel) {
    val inputFormat = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()) }
    val outputFormat = remember { SimpleDateFormat("MMM d, yyyy", Locale.getDefault()) }

    val formattedDate = remember(entry.entryDate) {
        try {
            inputFormat.parse(entry.entryDate)?.let { outputFormat.format(it) } ?: entry.entryDate
        } catch (e: Exception) {
            entry.entryDate
        }
    }

    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(formattedDate, color = TextSecondary, style = Typography.bodyMedium)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("${entry.weight} lbs", fontWeight = FontWeight.Bold, color = TextPrimary, style = Typography.bodyLarge)
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(onClick = { viewModel.deleteBodyweight(entry.entryDate) }) {
                Icon(Icons.Default.Delete, contentDescription = "Delete", modifier = Modifier.size(18.dp), tint = TextMuted)
            }
        }
    }
    HorizontalDivider(color = BorderSubtle)
}
