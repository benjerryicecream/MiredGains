// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  isCustom?: boolean;
  updatedAt?: string;
}

export interface WorkoutSet {
  id: string;
  weight: number;   // lbs or kg — user-chosen unit
  reps: number;
  completed: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: string;           // ISO string
  durationMs: number;
  exercises: WorkoutExercise[];
  notes?: string;
  updatedAt?: string;
}

export interface BodyweightEntry {
  id: string;
  date: string;   // "YYYY-MM-DD"
  weight: number;
  updatedAt?: string;
}

export interface TargetSet {
  id: string;
  targetWeight: number;
  targetReps: number;
}

export interface PlannedExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: TargetSet[];
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  plannedExercises: PlannedExercise[];
  updatedAt?: string;
}

export interface ScheduledWorkout {
  id: string;
  title: string;                    // e.g. "Chest & Triceps"
  date: string;                     // "YYYY-MM-DD"
  time: string;                     // "HH:mm" (24-hour)
  scheduledAt: string;              // ISO timestamp
  plannedExercises: PlannedExercise[]; // Full pre-planned exercises with target sets/reps/weight
  exerciseIds?: string[];           // Legacy fallback
  notificationId?: string;          // expo-notifications ID
  completed?: boolean;
  notes?: string;
  updatedAt?: string;
}

export type WeightUnit = 'lbs' | 'kg';
