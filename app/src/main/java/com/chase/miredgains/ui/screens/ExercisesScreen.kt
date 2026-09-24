package com.chase.miredgains.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.chase.miredgains.data.Exercise
import com.chase.miredgains.ui.AppViewModel
import com.chase.miredgains.ui.components.AddExerciseDialog
import com.chase.miredgains.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExercisesScreen(viewModel: AppViewModel) {
    val exercises by viewModel.allExercises.collectAsState(initial = emptyList())
    var showAddDialog by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedGroup by remember { mutableStateOf<String?>(null) }

    val muscleGroups = remember(exercises) {
        exercises.map { it.muscleGroup }.distinct().sorted()
    }

    val filteredExercises = remember(exercises, searchQuery, selectedGroup) {
        exercises.filter {
            (selectedGroup == null || it.muscleGroup == selectedGroup) &&
            it.name.contains(searchQuery, ignoreCase = true)
        }.sortedWith(compareBy({ it.muscleGroup }, { it.name }))
    }

    Scaffold(
        containerColor = Bg,
        topBar = {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Exercises", style = Typography.titleLarge, color = TextPrimary)
                    IconButton(
                        onClick = { showAddDialog = true },
                        modifier = Modifier
                            .size(40.dp)
                            .background(Emerald, RoundedCornerShape(12.dp))
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.White)
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                TextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search exercises...", color = TextMuted) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = BgInput,
                        unfocusedContainerColor = BgInput,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        FilterChip(
                            selected = selectedGroup == null,
                            onClick = { selectedGroup = null },
                            label = { Text("All") },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldBg,
                                selectedLabelColor = Emerald
                            )
                        )
                    }
                    items(muscleGroups) { group ->
                        FilterChip(
                            selected = selectedGroup == group,
                            onClick = { selectedGroup = group },
                            label = { Text(group) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldBg,
                                selectedLabelColor = Emerald
                            )
                        )
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(filteredExercises) { exercise ->
                ExerciseRow(
                    exercise = exercise,
                    onDelete = { viewModel.deleteExercise(exercise) }
                )
                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = BorderSubtle)
            }
            item { Spacer(modifier = Modifier.height(32.dp)) }
        }
    }

    if (showAddDialog) {
        AddExerciseDialog(
            onDismiss = { showAddDialog = false },
            onSave = { name, group ->
                viewModel.addExercise(name, group)
                showAddDialog = false
            }
        )
    }
}

@Composable
fun ExerciseRow(exercise: Exercise, onDelete: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(exercise.name, style = Typography.bodyLarge, color = TextPrimary, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(4.dp))
            Surface(
                color = getMuscleGroupColor(exercise.muscleGroup).copy(alpha = 0.15f),
                shape = RoundedCornerShape(100.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, getMuscleGroupColor(exercise.muscleGroup).copy(alpha = 0.35f))
            ) {
                Text(
                    exercise.muscleGroup,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = getMuscleGroupColor(exercise.muscleGroup)
                )
            }
        }
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (exercise.isCustom) {
                Surface(
                    color = EmeraldBg,
                    shape = RoundedCornerShape(100.dp),
                    modifier = Modifier.padding(end = 8.dp)
                ) {
                    Text(
                        "Custom",
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Emerald
                    )
                }
            }
            
            IconButton(onClick = onDelete) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Delete",
                    tint = if (exercise.isCustom) Danger else TextMuted,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

fun getMuscleGroupColor(group: String): Color = when (group) {
    "Back" -> Color(0xFF6366F1)
    "Chest" -> Color(0xFFEC4899)
    "Shoulders" -> Color(0xFFF59E0B)
    "Biceps" -> Color(0xFF3B82F6)
    "Triceps" -> Color(0xFF8B5CF6)
    "Legs" -> Color(0xFF10B981)
    "Core" -> Color(0xFFF97316)
    "Glutes" -> Color(0xFFEF4444)
    "Calves" -> Color(0xFF06B6D4)
    "Cardio" -> Color(0xFF84CC16)
    else -> Color(0xFF6B7280)
}
