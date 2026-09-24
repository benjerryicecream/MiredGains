import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from 'react';
import { WorkoutExercise, WorkoutSet } from '../types';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

// ─── State ────────────────────────────────────────────────────────────────────
interface WorkoutState {
  active: boolean;
  startTime: number | null;
  exercises: WorkoutExercise[];
  notes: string;
}

const initial: WorkoutState = {
  active: false,
  startTime: null,
  exercises: [],
  notes: '',
};

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'START' }
  | { type: 'DISCARD' }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'ADD_EXERCISE'; payload: WorkoutExercise }
  | { type: 'REMOVE_EXERCISE'; payload: string }
  | { type: 'ADD_SET'; payload: { exerciseId: string } }
  | { type: 'UPDATE_SET'; payload: { exerciseId: string; set: WorkoutSet } }
  | { type: 'REMOVE_SET'; payload: { exerciseId: string; setId: string } }
  | { type: 'TOGGLE_SET'; payload: { exerciseId: string; setId: string } };

function makeEmptySet(): WorkoutSet {
  return { id: uuid(), weight: 0, reps: 0, completed: false };
}

function reducer(state: WorkoutState, action: Action): WorkoutState {
  switch (action.type) {
    case 'START':
      return { ...initial, active: true, startTime: Date.now() };

    case 'DISCARD':
      return initial;

    case 'SET_NOTES':
      return { ...state, notes: action.payload };

    case 'ADD_EXERCISE':
      if (state.exercises.find((e) => e.exerciseId === action.payload.exerciseId))
        return state;
      return {
        ...state,
        exercises: [...state.exercises, action.payload],
      };

    case 'REMOVE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter(
          (e) => e.exerciseId !== action.payload
        ),
      };

    case 'ADD_SET': {
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== action.payload.exerciseId) return ex;
          // Copy last set values for quick re-entry
          const last = ex.sets[ex.sets.length - 1];
          const newSet = last
            ? { ...last, id: uuid(), weight: last.weight, reps: last.reps, completed: false }
            : makeEmptySet();
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
      };
    }

    case 'UPDATE_SET':
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== action.payload.exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === action.payload.set.id ? action.payload.set : s
            ),
          };
        }),
      };

    case 'REMOVE_SET':
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== action.payload.exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.filter((s) => s.id !== action.payload.setId),
          };
        }),
      };

    case 'TOGGLE_SET':
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== action.payload.exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === action.payload.setId
                ? { ...s, completed: !s.completed }
                : s
            ),
          };
        }),
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface WorkoutContextValue extends WorkoutState {
  startWorkout: () => void;
  discardWorkout: () => void;
  setNotes: (notes: string) => void;
  addExercise: (ex: WorkoutExercise) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, set: WorkoutSet) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  toggleSet: (exerciseId: string, setId: string) => void;
  elapsedMs: () => number;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const startWorkout = useCallback(() => dispatch({ type: 'START' }), []);
  const discardWorkout = useCallback(() => dispatch({ type: 'DISCARD' }), []);
  const setNotes = useCallback((notes: string) => dispatch({ type: 'SET_NOTES', payload: notes }), []);
  const addExercise = useCallback(
    (ex: WorkoutExercise) => dispatch({ type: 'ADD_EXERCISE', payload: ex }),
    []
  );
  const removeExercise = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_EXERCISE', payload: id }),
    []
  );
  const addSet = useCallback(
    (exerciseId: string) =>
      dispatch({ type: 'ADD_SET', payload: { exerciseId } }),
    []
  );
  const updateSet = useCallback(
    (exerciseId: string, set: WorkoutSet) =>
      dispatch({ type: 'UPDATE_SET', payload: { exerciseId, set } }),
    []
  );
  const removeSet = useCallback(
    (exerciseId: string, setId: string) =>
      dispatch({ type: 'REMOVE_SET', payload: { exerciseId, setId } }),
    []
  );
  const toggleSet = useCallback(
    (exerciseId: string, setId: string) =>
      dispatch({ type: 'TOGGLE_SET', payload: { exerciseId, setId } }),
    []
  );
  const elapsedMs = useCallback(
    () => (state.startTime ? Date.now() - state.startTime : 0),
    [state.startTime]
  );

  return (
    <WorkoutContext.Provider
      value={{
        ...state,
        startWorkout,
        discardWorkout,
        setNotes,
        addExercise,
        removeExercise,
        addSet,
        updateSet,
        removeSet,
        toggleSet,
        elapsedMs,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
