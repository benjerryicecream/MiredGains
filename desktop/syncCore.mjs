// Pure state-merge logic for the local sync server. Plain ESM, no
// React Native imports, so it can only be loaded by Node.
//
// Merge semantics: union of records by id. When the same id exists on both
// sides, the record with the newer `updatedAt` stamp wins (last-write-wins).
// `updatedAt` is set by the app on every create/update. Deletions do not
// propagate — a record removed on one device will reappear after a sync.

function parseTime(v) {
  const t = Date.parse(v || '');
  return Number.isNaN(t) ? 0 : t;
}

function newer(a, b) {
  return parseTime(b.updatedAt) >= parseTime(a.updatedAt) ? b : a;
}

function mergeById(listA, listB) {
  const map = new Map((listA || []).map((x) => [x.id, x]));
  for (const item of listB || []) {
    const cur = map.get(item.id);
    map.set(item.id, cur ? newer(cur, item) : item);
  }
  return [...map.values()];
}

export function mergeStates(a, b) {
  const unitBNewer = parseTime(b.unitUpdatedAt) >= parseTime(a.unitUpdatedAt);
  return {
    exercises: mergeById(a.exercises, b.exercises),
    workouts: mergeById(a.workouts, b.workouts),
    bodyweights: mergeById(a.bodyweights, b.bodyweights),
    scheduledWorkouts: mergeById(a.scheduledWorkouts, b.scheduledWorkouts),
    templates: mergeById(a.templates, b.templates),
    unit: unitBNewer ? (b.unit ?? a.unit) : (a.unit ?? b.unit ?? 'lbs'),
    unitUpdatedAt: unitBNewer ? b.unitUpdatedAt : a.unitUpdatedAt,
  };
}

// Coerce any posted/loaded payload into a well-formed state object.
export function normalizeState(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    exercises: Array.isArray(s.exercises) ? s.exercises : [],
    workouts: Array.isArray(s.workouts) ? s.workouts : [],
    bodyweights: Array.isArray(s.bodyweights) ? s.bodyweights : [],
    scheduledWorkouts: Array.isArray(s.scheduledWorkouts) ? s.scheduledWorkouts : [],
    templates: Array.isArray(s.templates) ? s.templates : [],
    unit: s.unit === 'kg' ? 'kg' : 'lbs',
    unitUpdatedAt: typeof s.unitUpdatedAt === 'string' ? s.unitUpdatedAt : undefined,
  };
}
