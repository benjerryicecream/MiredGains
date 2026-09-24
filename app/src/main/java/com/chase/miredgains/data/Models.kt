package com.chase.miredgains.data

import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Relation
import java.util.UUID

@Entity(tableName = "exercises")
data class Exercise(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val muscleGroup: String,
    val isCustom: Boolean = false
)

@Entity(tableName = "workouts")
data class Workout(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val date: Long = System.currentTimeMillis(),
    val durationMs: Long = 0,
    val notes: String? = null
)

@Entity(tableName = "workout_exercises")
data class WorkoutExercise(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val workoutId: String,
    val exerciseId: String,
    val exerciseName: String,
    val order: Int
)

@Entity(tableName = "workout_sets")
data class WorkoutSet(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val workoutExerciseId: String,
    val weight: Float,
    val reps: Int,
    val completed: Boolean = false,
    val order: Int
)

@Entity(tableName = "bodyweight_entries")
data class BodyweightEntry(
    @PrimaryKey val entryDate: String, // YYYY-MM-DD
    val weight: Float
)

data class WorkoutExerciseWithSets(
    @Embedded val exercise: WorkoutExercise,
    @Relation(
        parentColumn = "id",
        entityColumn = "workoutExerciseId"
    )
    val sets: List<WorkoutSet>
)

data class WorkoutWithDetails(
    @Embedded val workout: Workout,
    @Relation(
        entity = WorkoutExercise::class,
        parentColumn = "id",
        entityColumn = "workoutId"
    )
    val exercises: List<WorkoutExerciseWithSets>
)
