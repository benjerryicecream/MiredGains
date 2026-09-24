import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { Platform } from 'react-native';
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
  unitUpdatedAt?: string;
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
  | { type: 'REPLACE_STATE'; payload: Partial<AppState> }
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

    // Adopt a merged state coming back from the sync server
    case 'REPLACE_STATE':
      return {
        ...state,
        exercises: action.payload.exercises ?? state.exercises,
        workouts: action.payload.workouts ?? state.workouts,
        bodyweights: action.payload.bodyweights ?? state.bodyweights,
        scheduledWorkouts: action.payload.scheduledWorkouts ?? state.scheduledWorkouts,
        templates: action.payload.templates ?? state.templates,
        unit: action.payload.unit ?? state.unit,
        unitUpdatedAt: action.payload.unitUpdatedAt ?? state.unitUpdatedAt,
        loaded: true,
      };

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
          sw.id === action.payload ? { ...sw, completed: true, updatedAt: new Date().toISOString() } : sw
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
      return {
        ...state,
        unit: action.payload,
        unitUpdatedAt: new Date().toISOString(),
      };

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
  replaceAll: (payload: Partial<AppState>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Hydrate: local sync server on web, AsyncStorage on device ─────────────
  useEffect(() => {
    if (Platform.OS === 'web') {
      (async () => {
        try {
          const res = await fetch('/api/state');
          const raw = await res.json();
          dispatch({
            type: 'HYDRATE',
            payload: {
              exercises: Array.isArray(raw.exercises) ? raw.exercises : DEFAULT_EXERCISES,
              workouts: Array.isArray(raw.workouts) ? raw.workouts : [],
              bodyweights: Array.isArray(raw.bodyweights) ? raw.bodyweights : [],
              scheduledWorkouts: Array.isArray(raw.scheduledWorkouts) ? raw.scheduledWorkouts : [],
              templates: Array.isArray(raw.templates) ? raw.templates : [],
              unit: raw.unit === 'kg' ? 'kg' : 'lbs',
              unitUpdatedAt: raw.unitUpdatedAt,
            },
          });
        } catch {
          // Server unreachable — still render with defaults
          dispatch({ type: 'HYDRATE', payload: {} });
        }
      })();
      return;
    }
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

  // ── Persist on state change (AsyncStorage on device; server push on web) ──
  useEffect(() => {
    if (!state.loaded || Platform.OS === 'web') return;
    save(KEYS.EXERCISES, state.exercises);
  }, [state.exercises, state.loaded]);

  useEffect(() => {
    if (!state.loaded || Platform.OS === 'web') return;
    save(KEYS.WORKOUTS, state.workouts);
  }, [state.workouts, state.loaded]);

  useEffect(() => {
    if (!state.loaded || Platform.OS === 'web') return;
    save(KEYS.BODYWEIGHTS, state.bodyweights);
  }, [state.bodyweights, state.loaded]);

  useEffect(() => {
    if (!state.loaded || Platform.OS === 'web') return;
    save(KEYS.SCHEDULED_WORKOUTS, state.scheduledWorkouts);
  }, [state.scheduledWorkouts, state.loaded]);

  useEffect(() => {
    if (!state.loaded || Platform.OS === 'web') return;
    save(KEYS.WORKOUT_TEMPLATES, state.templates);
  }, [state.templates, state.loaded]);

  useEffect(() => {
    if (!state.loaded || Platform.OS === 'web') return;
    save(KEYS.UNIT, state.unit);
  }, [state.unit, state.loaded]);

  // ── Web: push full state to the desktop sync server (debounced) ───────────
  const lastPushedRef = useRef('');
  const stateJson = JSON.stringify({
    exercises: state.exercises,
    workouts: state.workouts,
    bodyweights: state.bodyweights,
    scheduledWorkouts: state.scheduledWorkouts,
    templates: state.templates,
    unit: state.unit,
    unitUpdatedAt: state.unitUpdatedAt,
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || !state.loaded) return;
    if (stateJson === lastPushedRef.current) return;
    const id = setTimeout(async () => {
      try {
        const res = await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: stateJson,
        });
        if (!res.ok) return;
        lastPushedRef.current = stateJson;
        const merged = await res.json();
        // Adopt merged records that only existed on the server; a no-op
        // whenever the server had nothing new, so this converges.
        dispatch({ type: 'REPLACE_STATE', payload: merged });
      } catch {
        // Server unreachable — keep working locally, retried on next change
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [stateJson, state.loaded]);

  // ── Actions ──────────────────────────────────────────────────────────────
  // Records carry an updatedAt stamp so the sync merge can resolve conflicts
  const now = () => new Date().toISOString();
  const addExercise = useCallback(
    (e: Exercise) => dispatch({ type: 'ADD_EXERCISE', payload: { ...e, updatedAt: now() } }),
    []
  );
  const deleteExercise = useCallback(
    (id: string) => dispatch({ type: 'DELETE_EXERCISE', payload: id }),
    []
  );
  const saveWorkout = useCallback(
    (w: Workout) => dispatch({ type: 'SAVE_WORKOUT', payload: { ...w, updatedAt: now() } }),
    []
  );
  const updateWorkout = useCallback(
    (w: Workout) => dispatch({ type: 'UPDATE_WORKOUT', payload: { ...w, updatedAt: now() } }),
    []
  );
  const deleteWorkout = useCallback(
    (id: string) => dispatch({ type: 'DELETE_WORKOUT', payload: id }),
    []
  );
  const upsertBodyweight = useCallback(
    (entry: BodyweightEntry) =>
      dispatch({ type: 'UPSERT_BODYWEIGHT', payload: { ...entry, updatedAt: now() } }),
    []
  );
  const deleteBodyweight = useCallback(
    (id: string) => dispatch({ type: 'DELETE_BODYWEIGHT', payload: id }),
    []
  );
  const scheduleWorkout = useCallback(
    (sw: ScheduledWorkout) =>
      dispatch({ type: 'SCHEDULE_WORKOUT', payload: { ...sw, updatedAt: now() } }),
    []
  );
  const updateScheduledWorkout = useCallback(
    (sw: ScheduledWorkout) =>
      dispatch({ type: 'UPDATE_SCHEDULED_WORKOUT', payload: { ...sw, updatedAt: now() } }),
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
      dispatch({ type: 'ADD_TEMPLATE', payload: { ...t, updatedAt: now() } }),
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
  const replaceAll = useCallback(
    (payload: Partial<AppState>) => dispatch({ type: 'REPLACE_STATE', payload }),
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
        replaceAll,
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
