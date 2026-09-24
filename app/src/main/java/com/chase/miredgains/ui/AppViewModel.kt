package com.chase.miredgains.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.chase.miredgains.data.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch
import java.util.UUID

data class ActiveSet(
    val id: String = UUID.randomUUID().toString(),
    var weight: String = "",
    var reps: String = "",
    var completed: Boolean = false
)

data class ActiveExercise(
    val exercise: Exercise,
    val sets: MutableList<ActiveSet> = mutableStateListOf(ActiveSet())
)

class AppViewModel(private val repository: WorkoutRepository) : ViewModel() {
    val allExercises: Flow<List<Exercise>> = repository.allExercises
    val allWorkouts: Flow<List<WorkoutWithDetails>> = repository.allWorkouts
    val allBodyweightEntries: Flow<List<BodyweightEntry>> = repository.allBodyweightEntries

    // Active Workout State
    var isWorkoutActive by mutableStateOf(false)
    var activeWorkoutStartTime by mutableStateOf(0L)
    val activeExercises = mutableStateListOf<ActiveExercise>()
    var workoutNotes by mutableStateOf("")

    fun startWorkout() {
        isWorkoutActive = true
        activeWorkoutStartTime = System.currentTimeMillis()
        activeExercises.clear()
        workoutNotes = ""
    }

    fun addExerciseToWorkout(exercise: Exercise) {
        activeExercises.add(ActiveExercise(exercise))
    }

    fun finishWorkout() {
        viewModelScope.launch {
            val workout = Workout(
                date = activeWorkoutStartTime,
                durationMs = System.currentTimeMillis() - activeWorkoutStartTime,
                notes = workoutNotes.ifBlank { null }
            )
            
            val exercisesToSave = activeExercises.mapIndexed { index, activeEx ->
                val ex = WorkoutExercise(
                    workoutId = workout.id,
                    exerciseId = activeEx.exercise.id,
                    exerciseName = activeEx.exercise.name,
                    order = index
                )
                val sets = activeEx.sets.filter { it.completed }.mapIndexed { setIndex, activeSet ->
                    WorkoutSet(
                        workoutExerciseId = ex.id,
                        weight = activeSet.weight.toFloatOrNull() ?: 0f,
                        reps = activeSet.reps.toIntOrNull() ?: 0,
                        completed = true,
                        order = setIndex
                    )
                }
                Pair(ex, sets)
            }.filter { it.second.isNotEmpty() }

            if (exercisesToSave.isNotEmpty()) {
                repository.saveFullWorkout(workout, exercisesToSave)
            }
            
            isWorkoutActive = false
        }
    }

    fun deleteWorkout(workoutId: String) {
        viewModelScope.launch {
            repository.deleteWorkout(workoutId)
        }
    }

    fun addExercise(name: String, muscleGroup: String) {
        viewModelScope.launch {
            repository.insertExercise(Exercise(name = name, muscleGroup = muscleGroup, isCustom = true))
        }
    }

    fun deleteExercise(exercise: Exercise) {
        viewModelScope.launch {
            repository.deleteExercise(exercise)
        }
    }

    fun upsertBodyweight(date: String, weight: Float) {
        viewModelScope.launch {
            repository.upsertBodyweight(BodyweightEntry(entryDate = date, weight = weight))
        }
    }

    fun deleteBodyweight(date: String) {
        viewModelScope.launch {
            repository.deleteBodyweight(date)
        }
    }

    fun clearAllData() {
        viewModelScope.launch {
            repository.clearAllData()
        }
    }
}

class AppViewModelFactory(private val repository: WorkoutRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AppViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AppViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
