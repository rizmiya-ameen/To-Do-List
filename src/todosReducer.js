const updateTodo = (state, id, update) => state.map(t => (t.id === id ? update(t) : t));

const updateSubtasks = (state, id, update) =>
  updateTodo(state, id, t => ({ ...t, subtasks: update(t.subtasks) }));

export function todosReducer(state, action) {
  switch (action.type) {
    case 'add':
      return [action.todo, ...state];

    case 'toggle':
      return updateTodo(state, action.id, t => ({ ...t, completed: !t.completed }));

    case 'setCompleted': {
      const ids = new Set(action.ids);
      return state.map(t => (ids.has(t.id) ? { ...t, completed: action.completed } : t));
    }

    case 'update':
      return updateTodo(state, action.id, t => ({ ...t, ...action.changes }));

    case 'delete':
      return state.filter(t => t.id !== action.id);

    case 'restore': {
      const next = [...state];
      next.splice(Math.min(action.index, next.length), 0, action.todo);
      return next;
    }

    case 'replace':
      return action.todos;

    case 'move': {
      const from = state.findIndex(t => t.id === action.fromId);
      const to = state.findIndex(t => t.id === action.toId);
      if (from < 0 || to < 0 || from === to) return state;
      const next = [...state];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    }

    case 'addSubtask':
      return updateSubtasks(state, action.id, subs => [...subs, action.subtask]);

    case 'toggleSubtask':
      return updateSubtasks(state, action.id, subs =>
        subs.map(s => (s.id === action.subtaskId ? { ...s, done: !s.done } : s))
      );

    case 'deleteSubtask':
      return updateSubtasks(state, action.id, subs => subs.filter(s => s.id !== action.subtaskId));

    default:
      return state;
  }
}
