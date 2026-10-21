import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import {
  Exercise,
  BodyweightEntry,
  Workout,
  ScheduledWorkout,
  WorkoutTemplate,
  WeightUnit,
} from '../types';
import DEFAULT_EXERCISES from '../constants/defaultExercises';
import { load, save, KEYS } from '../hooks/useStorage';

// ─── State ────────────────────────────────────────────────────────────────────
interface AppState {
  exercises: Exercise[];
  workouts: Workout[];
  bodyweights: BodyweightEntry[];
  scheduledWorkouts: ScheduledWorkout[];
  templates: WorkoutTemplate[];
  unit: WeightUnit;
  loaded: boolean;
}

const initialState: AppState = {
  exercises: DEFAULT_EXERCISES,
  workouts: [],
  bodyweights: [],
  scheduledWorkouts: [],
  templates: [],
  unit: 'lbs',
  loaded: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'DELETE_EXERCISE'; payload: string }
  | { type: 'SAVE_WORKOUT'; payload: Workout }
  | { type: 'UPDATE_WORKOUT'; payload: Workout }
  | { type: 'DELETE_WORKOUT'; payload: string }
  | { type: 'UPSERT_BODYWEIGHT'; payload: BodyweightEntry }
  | { type: 'DELETE_BODYWEIGHT'; payload: string }
  | { type: 'SCHEDULE_WORKOUT'; payload: ScheduledWorkout }
  | { type: 'UPDATE_SCHEDULED_WORKOUT'; payload: ScheduledWorkout }
  | { type: 'DELETE_SCHEDULED_WORKOUT'; payload: string }
  | { type: 'COMPLETE_SCHEDULED_WORKOUT'; payload: string }
  | { type: 'ADD_TEMPLATE'; payload: WorkoutTemplate }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'SET_UNIT'; payload: WeightUnit };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, loaded: true };

    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] };

    case 'DELETE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter((e) => e.id !== action.payload),
      };

    case 'SAVE_WORKOUT':
      return {
        ...state,
        workouts: [action.payload, ...state.workouts],
      };

    case 'DELETE_WORKOUT':
      return {
        ...state,
        workouts: state.workouts.filter((w) => w.id !== action.payload),
      };

    case 'UPDATE_WORKOUT':
      return {
        ...state,
        workouts: state.workouts.map((w) =>
          w.id === action.payload.id ? action.payload : w
        ),
      };

    case 'UPSERT_BODYWEIGHT': {
      const existing = state.bodyweights.findIndex(
        (b) => b.date === action.payload.date
      );
      if (existing >= 0) {
        const updated = [...state.bodyweights];
        updated[existing] = action.payload;
        return { ...state, bodyweights: updated };
      }
      return {
        ...state,
        bodyweights: [action.payload, ...state.bodyweights],
      };
    }

    case 'DELETE_BODYWEIGHT':
      return {
        ...state,
        bodyweights: state.bodyweights.filter((b) => b.id !== action.payload),
      };

    case 'SCHEDULE_WORKOUT':
      return {
        ...state,
        scheduledWorkouts: [action.payload, ...state.scheduledWorkouts],
      };

    case 'UPDATE_SCHEDULED_WORKOUT':
      return {
        ...state,
        scheduledWorkouts: state.scheduledWorkouts.map((sw) =>
          sw.id === action.payload.id ? action.payload : sw
        ),
      };

    case 'DELETE_SCHEDULED_WORKOUT':
      return {
        ...state,
        scheduledWorkouts: state.scheduledWorkouts.filter(
          (sw) => sw.id !== action.payload
        ),
      };

    case 'COMPLETE_SCHEDULED_WORKOUT':
      return {
        ...state,
        scheduledWorkouts: state.scheduledWorkouts.map((sw) =>
          sw.id === action.payload ? { ...sw, completed: true } : sw
        ),
      };

    case 'ADD_TEMPLATE':
      return {
        ...state,
        templates: [action.payload, ...state.templates],
      };

    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.payload),
      };

    case 'SET_UNIT':
      return { ...state, unit: action.payload };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue extends AppState {
  addExercise: (e: Exercise) => void;
  deleteExercise: (id: string) => void;
  saveWorkout: (w: Workout) => void;
  updateWorkout: (w: Workout) => void;
  deleteWorkout: (id: string) => void;
  upsertBodyweight: (entry: BodyweightEntry) => void;
  deleteBodyweight: (id: string) => void;
  scheduleWorkout: (sw: ScheduledWorkout) => void;
  updateScheduledWorkout: (sw: ScheduledWorkout) => void;
  deleteScheduledWorkout: (id: string) => void;
  completeScheduledWorkout: (id: string) => void;
  addTemplate: (t: WorkoutTemplate) => void;
  deleteTemplate: (id: string) => void;
  setUnit: (u: WeightUnit) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Hydrate from AsyncStorage ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [exercises, workouts, bodyweights, scheduledWorkouts, templates, unit] = await Promise.all([
        load<Exercise[]>(KEYS.EXERCISES, DEFAULT_EXERCISES),
        load<Workout[]>(KEYS.WORKOUTS, []),
        load<BodyweightEntry[]>(KEYS.BODYWEIGHTS, []),
        load<ScheduledWorkout[]>(KEYS.SCHEDULED_WORKOUTS, []),
        load<WorkoutTemplate[]>(KEYS.WORKOUT_TEMPLATES, []),
        load<WeightUnit>(KEYS.UNIT, 'lbs'),
      ]);
      dispatch({
        type: 'HYDRATE',
        payload: { exercises, workouts, bodyweights, scheduledWorkouts, templates, unit },
      });
    })();
  }, []);

  // ── Persist on state change (AsyncStorage) ────────────────────────────────
  useEffect(() => {
    if (!state.loaded) return;
    save(KEYS.EXERCISES, state.exercises);
  }, [state.exercises, state.loaded]);

  useEffect(() => {
    if (!state.loaded) return;
    save(KEYS.WORKOUTS, state.workouts);
  }, [state.workouts, state.loaded]);

  useEffect(() => {
    if (!state.loaded) return;
    save(KEYS.BODYWEIGHTS, state.bodyweights);
  }, [state.bodyweights, state.loaded]);

  useEffect(() => {
    if (!state.loaded) return;
    save(KEYS.SCHEDULED_WORKOUTS, state.scheduledWorkouts);
  }, [state.scheduledWorkouts, state.loaded]);

  useEffect(() => {
    if (!state.loaded) return;
    save(KEYS.WORKOUT_TEMPLATES, state.templates);
  }, [state.templates, state.loaded]);

  useEffect(() => {
    if (!state.loaded) return;
    save(KEYS.UNIT, state.unit);
  }, [state.unit, state.loaded]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const addExercise = useCallback(
    (e: Exercise) => dispatch({ type: 'ADD_EXERCISE', payload: e }),
    []
  );
  const deleteExercise = useCallback(
    (id: string) => dispatch({ type: 'DELETE_EXERCISE', payload: id }),
    []
  );
  const saveWorkout = useCallback(
    (w: Workout) => dispatch({ type: 'SAVE_WORKOUT', payload: w }),
    []
  );
  const updateWorkout = useCallback(
    (w: Workout) => dispatch({ type: 'UPDATE_WORKOUT', payload: w }),
    []
  );
  const deleteWorkout = useCallback(
    (id: string) => dispatch({ type: 'DELETE_WORKOUT', payload: id }),
    []
  );
  const upsertBodyweight = useCallback(
    (entry: BodyweightEntry) =>
      dispatch({ type: 'UPSERT_BODYWEIGHT', payload: entry }),
    []
  );
  const deleteBodyweight = useCallback(
    (id: string) => dispatch({ type: 'DELETE_BODYWEIGHT', payload: id }),
    []
  );
  const scheduleWorkout = useCallback(
    (sw: ScheduledWorkout) =>
      dispatch({ type: 'SCHEDULE_WORKOUT', payload: sw }),
    []
  );
  const updateScheduledWorkout = useCallback(
    (sw: ScheduledWorkout) =>
      dispatch({ type: 'UPDATE_SCHEDULED_WORKOUT', payload: sw }),
    []
  );
  const deleteScheduledWorkout = useCallback(
    (id: string) =>
      dispatch({ type: 'DELETE_SCHEDULED_WORKOUT', payload: id }),
    []
  );
  const completeScheduledWorkout = useCallback(
    (id: string) =>
      dispatch({ type: 'COMPLETE_SCHEDULED_WORKOUT', payload: id }),
    []
  );
  const addTemplate = useCallback(
    (t: WorkoutTemplate) =>
      dispatch({ type: 'ADD_TEMPLATE', payload: t }),
    []
  );
  const deleteTemplate = useCallback(
    (id: string) =>
      dispatch({ type: 'DELETE_TEMPLATE', payload: id }),
    []
  );
  const setUnit = useCallback(
    (u: WeightUnit) => dispatch({ type: 'SET_UNIT', payload: u }),
    []
  );
  return (
    <AppContext.Provider
      value={{
        ...state,
        addExercise,
        deleteExercise,
        saveWorkout,
        updateWorkout,
        deleteWorkout,
        upsertBodyweight,
        deleteBodyweight,
        scheduleWorkout,
        updateScheduledWorkout,
        deleteScheduledWorkout,
        completeScheduledWorkout,
        addTemplate,
        deleteTemplate,
        setUnit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
