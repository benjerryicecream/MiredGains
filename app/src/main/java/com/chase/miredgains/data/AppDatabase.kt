package com.chase.miredgains.data

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface WorkoutDao {
    @Query("SELECT * FROM exercises ORDER BY name ASC")
    fun getAllExercises(): Flow<List<Exercise>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExercise(exercise: Exercise)

    @Delete
    suspend fun deleteExercise(exercise: Exercise)

    @Query("SELECT * FROM workouts ORDER BY date DESC")
    fun getAllWorkouts(): Flow<List<Workout>>

    @Transaction
    @Query("SELECT * FROM workouts ORDER BY date DESC")
    fun getAllWorkoutsWithDetails(): Flow<List<WorkoutWithDetails>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorkout(workout: Workout)

    @Query("DELETE FROM workouts WHERE id = :id")
    suspend fun deleteWorkoutById(id: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorkoutExercise(workoutExercise: WorkoutExercise)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorkoutSet(workoutSet: WorkoutSet)

    @Query("SELECT * FROM workout_exercises WHERE workoutId = :workoutId ORDER BY `order` ASC")
    suspend fun getExercisesForWorkout(workoutId: String): List<WorkoutExercise>

    @Query("SELECT * FROM workout_sets WHERE workoutExerciseId = :workoutExerciseId ORDER BY `order` ASC")
    suspend fun getSetsForExercise(workoutExerciseId: String): List<WorkoutSet>

    @Query("SELECT * FROM bodyweight_entries ORDER BY entryDate DESC")
    fun getAllBodyweightEntries(): Flow<List<BodyweightEntry>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBodyweightEntry(entry: BodyweightEntry)

    @Query("DELETE FROM bodyweight_entries WHERE entryDate = :dateStr")
    suspend fun deleteBodyweightEntry(dateStr: String)
    
    @Query("DELETE FROM workouts")
    suspend fun deleteAllWorkouts()
    
    @Query("DELETE FROM bodyweight_entries")
    suspend fun deleteAllBodyweight()
}

@Database(
    entities = [Exercise::class, Workout::class, WorkoutExercise::class, WorkoutSet::class, BodyweightEntry::class],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun workoutDao(): WorkoutDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "mired_gains_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
