package com.chase.miredgains.data

import kotlinx.coroutines.flow.Flow

class WorkoutRepository(private val workoutDao: WorkoutDao) {
    val allExercises: Flow<List<Exercise>> = workoutDao.getAllExercises()
    val allWorkouts: Flow<List<WorkoutWithDetails>> = workoutDao.getAllWorkoutsWithDetails()
    val allBodyweightEntries: Flow<List<BodyweightEntry>> = workoutDao.getAllBodyweightEntries()

    suspend fun insertExercise(exercise: Exercise) = workoutDao.insertExercise(exercise)
    suspend fun deleteExercise(exercise: Exercise) = workoutDao.deleteExercise(exercise)

    suspend fun insertWorkout(workout: Workout) = workoutDao.insertWorkout(workout)
    
    suspend fun saveFullWorkout(workout: Workout, exercises: List<Pair<WorkoutExercise, List<WorkoutSet>>>) {
        workoutDao.insertWorkout(workout)
        exercises.forEach { (ex, sets) ->
            workoutDao.insertWorkoutExercise(ex)
            sets.forEach { set ->
                workoutDao.insertWorkoutSet(set)
            }
        }
    }

    suspend fun deleteWorkout(workoutId: String) = workoutDao.deleteWorkoutById(workoutId)

    suspend fun getExercisesForWorkout(workoutId: String) = workoutDao.getExercisesForWorkout(workoutId)
    suspend fun getSetsForExercise(workoutExerciseId: String) = workoutDao.getSetsForExercise(workoutExerciseId)

    suspend fun upsertBodyweight(entry: BodyweightEntry) = workoutDao.insertBodyweightEntry(entry)
    suspend fun deleteBodyweight(entryDate: String) = workoutDao.deleteBodyweightEntry(entryDate)

    suspend fun clearAllData() {
        workoutDao.deleteAllWorkouts()
        workoutDao.deleteAllBodyweight()
    }
}
