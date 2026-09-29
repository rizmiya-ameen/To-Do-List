import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import './App.css';
import AddTodo from './components/AddTodo';
import Icon from './components/Icon';
import Progress from './components/Progress';
import Toast from './components/Toast';
import TodoItem from './components/TodoItem';
import Toolbar from './components/Toolbar';
import useLocalStorage from './hooks/useLocalStorage';
import { todosReducer } from './todosReducer';
import {
  SORTS,
  STORAGE_KEY,
  VIEWS,
  createId,
  loadTodos,
  matchesSearch,
  normalizeList,
  plural,
  saveTodos,
  sortTodos,
  toDateKey,
} from './utils';

const preferredTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';

const truncate = (text, max = 28) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const isTyping = target =>
  ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

export default function App() {
  const [todos, dispatch] = useReducer(todosReducer, undefined, loadTodos);
  const [view, setView] = useLocalStorage('todo-list.view', 'all');
  const [sort, setSort] = useLocalStorage('todo-list.sort', 'manual');
  const [theme, setTheme] = useLocalStorage('todo-list.theme', preferredTheme);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [toast, setToast] = useState(null);
  const [dragId, setDragId] = useState(null);
  const addInputRef = useRef(null);
  const searchRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => saveTodos(todos), [todos]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = e => {
      if (e.key === STORAGE_KEY) dispatch({ type: 'replace', todos: loadTodos() });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const onKeyDown = e => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        addInputRef.current?.focus();
      } else if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const today = toDateKey();
  const currentView = VIEWS.find(v => v.id === view) ?? VIEWS[0];
  const sortKey = SORTS.some(s => s.id === sort) ? sort : 'manual';
  const query = search.trim().toLowerCase();

  const categories = useMemo(
    () => [...new Set(todos.map(t => t.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [todos]
  );
  const activeCategory = categories.includes(category) ? category : '';

  const counts = useMemo(
    () => Object.fromEntries(VIEWS.map(v => [v.id, todos.filter(t => v.test(t, today)).length])),
    [todos, today]
  );

  const visible = useMemo(
    () =>
      sortTodos(
        todos.filter(
          t =>
            currentView.test(t, today) &&
            (!activeCategory || t.category === activeCategory) &&
            matchesSearch(t, query)
        ),
        sortKey
      ),
    [todos, currentView, today, activeCategory, query, sortKey]
  );

  const visibleActive = visible.filter(t => !t.completed);
  const isFiltered = currentView.id !== 'all' || !!activeCategory || !!query;

  const closeToast = useCallback(() => setToast(null), []);
  const notify = (message, undoAction) =>
    setToast({ key: Date.now(), message, undo: undoAction && (() => dispatch(undoAction)) });

  const addTodo = fields =>
    dispatch({
      type: 'add',
      todo: { id: createId(), completed: false, subtasks: [], createdAt: Date.now(), ...fields },
    });

  const deleteTodo = id => {
    const index = todos.findIndex(t => t.id === id);
    if (index < 0) return;
    const todo = todos[index];
    dispatch({ type: 'delete', id });
    notify(`Deleted "${truncate(todo.text)}"`, { type: 'restore', todo, index });
  };

  const replaceWithUndo = (next, message) => {
    const previous = todos;
    dispatch({ type: 'replace', todos: next });
    notify(message, { type: 'replace', todos: previous });
  };

  const completedCount = counts.completed;

  const clearCompleted = () =>
    replaceWithUndo(
      todos.filter(t => !t.completed),
      `Cleared ${completedCount} completed ${plural(completedCount, 'task')}`
    );

  const resetAll = () => replaceWithUndo([], 'All tasks removed');

  const completeVisible = () =>
    dispatch({ type: 'setCompleted', ids: visibleActive.map(t => t.id), completed: true });

  const clearFilters = () => {
    setView('all');
    setCategory('');
    setSearch('');
  };

  const exportTodos = () => {
    const blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-${today}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const importTodos = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const imported = normalizeList(Array.isArray(data) ? data : data?.todos);
      if (!imported.length) throw new Error('No tasks in file');
      replaceWithUndo(imported, `Imported ${imported.length} ${plural(imported.length, 'task')}`);
    } catch {
      notify("Couldn't import that file. Is it a to-do export?");
    }
  };

  const canDrag = sortKey === 'manual';
  const handleDragEnter = id => {
    if (dragId && dragId !== id) dispatch({ type: 'move', fromId: dragId, toId: id });
  };
  const handleDragEnd = useCallback(() => setDragId(null), []);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="title">To-do List</h1>
          <p className="date">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          type="button"
          className="icon-btn theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title="Toggle theme"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
        </button>
      </header>

      <Progress done={completedCount} total={todos.length} overdue={counts.overdue} />

      <main className="card">
        <AddTodo ref={addInputRef} onAdd={addTodo} />

        <Toolbar
          searchRef={searchRef}
          search={search}
          onSearch={setSearch}
          view={currentView.id}
          onView={setView}
          counts={counts}
          categories={categories}
          category={activeCategory}
          onCategory={setCategory}
          sort={sortKey}
          onSort={setSort}
        />

        {visible.length > 0 ? (
          <ul className="todo-list">
            {visible.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                dispatch={dispatch}
                onDelete={deleteTodo}
                query={query}
                draggable={canDrag}
                isDragging={dragId === todo.id}
                onDragStart={setDragId}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
              />
            ))}
          </ul>
        ) : (
          <div className="empty">
            <p className="empty-title">{todos.length ? 'Nothing here' : 'Your list is empty'}</p>
            <p className="empty-sub">
              {todos.length ? 'No tasks match these filters.' : 'Add your first task above to get started.'}
            </p>
            {todos.length > 0 && isFiltered && (
              <button type="button" className="primary-btn" onClick={clearFilters}>
                Show all tasks
              </button>
            )}
          </div>
        )}

        <footer className="list-footer">
          <span className="count">
            {counts.active} {plural(counts.active, 'task')} left
          </span>
          <div className="footer-actions">
            <button type="button" className="text-btn" onClick={completeVisible} disabled={!visibleActive.length}>
              <Icon name="checks" size={16} />
              Complete all
            </button>
            <button type="button" className="text-btn" onClick={clearCompleted} disabled={!completedCount}>
              Clear completed
            </button>
            <button type="button" className="text-btn danger" onClick={resetAll} disabled={!todos.length}>
              Reset
            </button>
          </div>
        </footer>
      </main>

      <div className="app-bottom">
        <div className="data-actions">
          <button type="button" className="text-btn" onClick={exportTodos} disabled={!todos.length}>
            <Icon name="download" size={16} />
            Export
          </button>
          <button type="button" className="text-btn" onClick={() => importRef.current?.click()}>
            <Icon name="upload" size={16} />
            Import
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={importTodos}
            data-testid="import-input"
          />
        </div>
        <p className="hint">
          <kbd>N</kbd> new task · <kbd>/</kbd> search · double-click a task to edit
          {canDrag ? ' · drag to reorder' : ''}
        </p>
      </div>

      <datalist id="category-options">
        {categories.map(c => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
