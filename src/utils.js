export const STORAGE_KEY = 'todo-list.todos.v1';

// Order used by the priority pickers (lowest to highest).
export const PRIORITIES = ['none', 'low', 'medium', 'high'];
export const PRIORITY_LABELS = { none: 'None', low: 'Low', medium: 'Medium', high: 'High' };
const PRIORITY_RANK = { high: 0, medium: 1, low: 2, none: 3 };

export const VIEWS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'active', label: 'Active', test: t => !t.completed },
  { id: 'today', label: 'Today', test: (t, today) => !t.completed && t.due === today },
  { id: 'overdue', label: 'Overdue', test: (t, today) => !t.completed && !!t.due && t.due < today },
  { id: 'urgent', label: 'Urgent', test: t => !t.completed && t.priority === 'high' },
  { id: 'completed', label: 'Done', test: t => t.completed },
];

export const SORTS = [
  { id: 'manual', label: 'My order' },
  { id: 'due', label: 'Due date' },
  { id: 'priority', label: 'Priority' },
  { id: 'newest', label: 'Newest' },
  { id: 'alpha', label: 'A → Z' },
];

const COMPARATORS = {
  manual: () => 0,
  due: (a, b) => (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99'),
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  newest: (a, b) => b.createdAt - a.createdAt,
  alpha: (a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }),
};

// Completed tasks always sink to the bottom; the sort is stable so "manual"
// keeps the user's drag-and-drop order.
export function sortTodos(list, sort) {
  const compare = COMPARATORS[sort] || COMPARATORS.manual;
  return [...list].sort((a, b) => a.completed - b.completed || compare(a, b));
}

export function matchesSearch(todo, query) {
  if (!query) return true;
  return (
    todo.text.toLowerCase().includes(query) ||
    todo.category.toLowerCase().includes(query) ||
    todo.subtasks.some(s => s.text.toLowerCase().includes(query))
  );
}

export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export const plural = (n, word) => (n === 1 ? word : `${word}s`);

// Dates are stored as local "YYYY-MM-DD" keys so they compare as strings.
export function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(days, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function describeDue(key, completed) {
  if (!key) return null;
  const date = parseDateKey(key);
  const diff = Math.round((date - parseDateKey(toDateKey())) / 86400000);

  let label;
  if (diff === 0) label = 'Today';
  else if (diff === 1) label = 'Tomorrow';
  else if (diff === -1) label = 'Yesterday';
  else if (diff > 1 && diff < 7) label = date.toLocaleDateString(undefined, { weekday: 'long' });
  else {
    const sameYear = date.getFullYear() === new Date().getFullYear();
    label = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric',
    });
  }

  let status;
  if (completed) status = 'done';
  else if (diff < 0) status = 'overdue';
  else if (diff === 0) status = 'today';
  else if (diff <= 2) status = 'soon';
  else status = 'later';

  return { label, status };
}

// Turns anything (stored data, an imported file, the old {todo, urgent} shape)
// into a valid todo, or null if it has no text.
export function normalizeTodo(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const text = String(raw.text ?? raw.todo ?? '').trim();
  if (!text) return null;

  const subtasks = Array.isArray(raw.subtasks) ? raw.subtasks : [];
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    text,
    completed: Boolean(raw.completed),
    priority: PRIORITIES.includes(raw.priority) ? raw.priority : raw.urgent ? 'high' : 'none',
    due: typeof raw.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.due) ? raw.due : '',
    category: typeof raw.category === 'string' ? raw.category.trim() : '',
    subtasks: subtasks
      .filter(s => s && String(s.text ?? '').trim())
      .map(s => ({
        id: typeof s.id === 'string' && s.id ? s.id : createId(),
        text: String(s.text).trim(),
        done: Boolean(s.done),
      })),
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
  };
}

export function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.map(normalizeTodo).filter(todo => {
    if (!todo) return false;
    if (seen.has(todo.id)) todo.id = createId();
    seen.add(todo.id);
    return true;
  });
}

export function sampleTodos() {
  return normalizeList([
    { text: 'Buy more cat food', priority: 'high', due: toDateKey(), category: 'Home' },
    {
      text: 'Clean the bathroom',
      priority: 'medium',
      due: addDays(1),
      category: 'Home',
      subtasks: [{ text: 'Scrub the tub' }, { text: 'Wash the mirror', done: true }],
    },
    { text: 'Finish homework', priority: 'low', due: addDays(-1), category: 'School' },
    { text: 'Call grandma', completed: true, category: 'Personal' },
  ]);
}

export function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) return normalizeList(JSON.parse(raw));
  } catch {
    // Corrupt or unavailable storage: fall through to the sample list.
  }
  return sampleTodos();
}

export function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Storage full or disabled; the app keeps working in memory.
  }
}
