package com.chase.miredgains.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.chase.miredgains.data.Exercise
import com.chase.miredgains.ui.ActiveExercise
import com.chase.miredgains.ui.ActiveSet
import com.chase.miredgains.ui.AppViewModel
import com.chase.miredgains.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun WorkoutScreen(viewModel: AppViewModel) {
    var showExercisePicker by remember { mutableStateOf(false) }

    if (!viewModel.isWorkoutActive) {
        IdleWorkoutScreen(onStart = { viewModel.startWorkout() })
    } else {
        ActiveWorkoutScreen(
            viewModel = viewModel,
            onAddExerciseClick = { showExercisePicker = true },
            onFinish = { viewModel.finishWorkout() },
            onDiscard = { viewModel.isWorkoutActive = false }
        )
    }

    if (showExercisePicker) {
        ExercisePicker(
            exercisesFlow = viewModel.allExercises,
            onDismiss = { showExercisePicker = false },
            onSelect = { exercise ->
                viewModel.addExerciseToWorkout(exercise)
                showExercisePicker = false
            }
        )
    }
}

@Composable
fun IdleWorkoutScreen(onStart: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp),
            modifier = Modifier.padding(horizontal = 32.dp)
        ) {
            Surface(
                modifier = Modifier.size(90.dp),
                shape = RoundedCornerShape(24.dp),
                color = EmeraldBg
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = null,
                        modifier = Modifier.size(44.dp),
                        tint = Emerald
                    )
                }
            }
            Text(
                text = "U Mirin'",
                style = Typography.titleLarge,
                color = TextPrimary
            )
            Text(
                text = "Start a new workout to begin logging your sets.",
                style = Typography.bodyMedium,
                color = TextSecondary,
                textAlign = TextAlign.Center,
                lineHeight = 21.sp
            )
            Button(
                onClick = onStart,
                colors = ButtonDefaults.buttonColors(containerColor = Emerald),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.padding(top = 8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text("Start Workout", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun ActiveWorkoutScreen(
    viewModel: AppViewModel,
    onAddExerciseClick: () -> Unit,
    onFinish: () -> Unit,
    onDiscard: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Active Workout", style = Typography.titleMedium, color = TextPrimary, fontWeight = FontWeight.ExtraBold)
                WorkoutTimer(viewModel.activeWorkoutStartTime)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = onDiscard) {
                    Text("Discard", color = TextSecondary)
                }
                Button(
                    onClick = onFinish,
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp)
                ) {
                    Text("Finish", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }

        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(viewModel.activeExercises) { activeEx ->
                ExerciseCard(
                    activeExercise = activeEx,
                    onRemove = { viewModel.activeExercises.remove(activeEx) }
                )
            }

            item {
                Button(
                    onClick = onAddExerciseClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BgElevated),
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(vertical = 4.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, tint = TextPrimary)
                        Text("Add Exercise", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                }
            }
            
            item {
                Spacer(modifier = Modifier.height(24.dp))
                Text("WORKOUT NOTES", style = Typography.labelSmall, color = TextSecondary)
                Spacer(modifier = Modifier.height(8.dp))
                TextField(
                    value = viewModel.workoutNotes,
                    onValueChange = { viewModel.workoutNotes = it },
                    placeholder = { Text("How did it go?", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth().height(100.dp),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = BgCard,
                        unfocusedContainerColor = BgCard,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    shape = RoundedCornerShape(12.dp)
                )
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun WorkoutTimer(startTime: Long) {
    var elapsed by remember { mutableStateOf(0L) }
    LaunchedEffect(startTime) {
        while (true) {
            elapsed = System.currentTimeMillis() - startTime
            delay(1000)
        }
    }
    
    val totalSeconds = elapsed / 1000
    val seconds = totalSeconds % 60
    val minutes = (totalSeconds / 60) % 60
    val hours = (totalSeconds / 3600)
    
    val timeText = if (hours > 0) {
        String.format("%d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format("%02d:%02d", minutes, seconds)
    }
    
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(Icons.Default.Build, contentDescription = null, modifier = Modifier.size(13.dp), tint = Emerald) 
        Text(timeText, style = Typography.labelSmall, color = Emerald, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun ExerciseCard(
    activeExercise: ActiveExercise,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = BgCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderSubtle)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(activeExercise.exercise.name, style = Typography.bodyLarge, fontWeight = FontWeight.Bold)
                IconButton(onClick = onRemove) {
                    Icon(Icons.Default.Close, contentDescription = null, tint = TextMuted, modifier = Modifier.size(18.dp))
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp)) {
                Text("SET", Modifier.width(32.dp), style = Typography.labelSmall, color = TextMuted)
                Text("WEIGHT", Modifier.weight(1f), style = Typography.labelSmall, color = TextMuted, textAlign = TextAlign.Center)
                Text("REPS", Modifier.weight(1f), style = Typography.labelSmall, color = TextMuted, textAlign = TextAlign.Center)
                Spacer(Modifier.width(48.dp))
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            activeExercise.sets.forEachIndexed { index, set ->
                SetRow(
                    index = index,
                    set = set,
                    onRemove = { if (activeExercise.sets.size > 1) activeExercise.sets.removeAt(index) }
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Button(
                onClick = { activeExercise.sets.add(ActiveSet()) },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.Add, contentDescription = null, tint = Emerald, modifier = Modifier.size(16.dp))
                    Text("Add Set", color = Emerald, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun SetRow(
    index: Int,
    set: ActiveSet,
    onRemove: () -> Unit
) {
    var weight by remember { mutableStateOf(set.weight) }
    var reps by remember { mutableStateOf(set.reps) }
    var completed by remember { mutableStateOf(set.completed) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .background(if (completed) EmeraldBg.copy(alpha = 0.5f) else Color.Transparent, RoundedCornerShape(8.dp))
            .padding(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            modifier = Modifier.size(24.dp),
            shape = RoundedCornerShape(6.dp),
            color = if (completed) Emerald else BgElevated
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text("${index + 1}", style = Typography.labelSmall, color = if (completed) Color.White else TextSecondary)
            }
        }
        
        TextField(
            value = weight,
            onValueChange = { weight = it; set.weight = it },
            modifier = Modifier.weight(1f),
            placeholder = { Text("0", color = TextMuted) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                focusedTextColor = if (completed) Emerald else TextPrimary
            ),
            textStyle = Typography.bodyMedium.copy(textAlign = TextAlign.Center)
        )
        
        TextField(
            value = reps,
            onValueChange = { reps = it; set.reps = it },
            modifier = Modifier.weight(1f),
            placeholder = { Text("0", color = TextMuted) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                focusedTextColor = if (completed) Emerald else TextPrimary
            ),
            textStyle = Typography.bodyMedium.copy(textAlign = TextAlign.Center)
        )
        
        IconButton(
            onClick = { completed = !completed; set.completed = completed },
            modifier = Modifier.size(32.dp).border(1.dp, if (completed) Emerald else Border, RoundedCornerShape(100.dp))
        ) {
            if (completed) Icon(Icons.Default.Check, contentDescription = null, tint = Emerald, modifier = Modifier.size(16.dp))
        }
        
        IconButton(onClick = onRemove) {
            Icon(Icons.Default.Delete, contentDescription = null, tint = TextMuted, modifier = Modifier.size(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExercisePicker(
    exercisesFlow: kotlinx.coroutines.flow.Flow<List<Exercise>>,
    onDismiss: () -> Unit,
    onSelect: (Exercise) -> Unit
) {
    val exercises by exercisesFlow.collectAsState(initial = emptyList())
    var query by remember { mutableStateOf("") }
    
    val filtered = exercises.filter { 
        it.name.contains(query, ignoreCase = true) || it.muscleGroup.contains(query, ignoreCase = true)
    }.groupBy { it.muscleGroup }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f)
                .padding(top = 24.dp),
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
            color = BgCard
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Add Exercise", style = Typography.titleMedium, fontWeight = FontWeight.Bold)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, null) }
                }
                
                TextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Search...", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = BgInput,
                        unfocusedContainerColor = BgInput,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = TextMuted) }
                )
                
                LazyColumn(modifier = Modifier.weight(1f)) {
                    filtered.forEach { (group, items) ->
                        item {
                            Text(
                                group.uppercase(),
                                modifier = Modifier.padding(vertical = 8.dp),
                                style = Typography.labelSmall,
                                color = TextMuted,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        items(items) { exercise ->
                            Text(
                                exercise.name,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onSelect(exercise) }
                                    .padding(vertical = 12.dp, horizontal = 4.dp),
                                style = Typography.bodyLarge
                            )
                            HorizontalDivider(color = BorderSubtle)
                        }
                    }
                }
            }
        }
    }
}
