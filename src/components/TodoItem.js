import { useState } from 'react';
import Icon from './Icon';
import PriorityPicker from './PriorityPicker';
import { PRIORITY_LABELS, createId, describeDue } from '../utils';

function Highlight({ text, query }) {
  const start = query ? text.toLowerCase().indexOf(query) : -1;
  if (start < 0) return text;
  const end = start + query.length;
  return (
    <>
      {text.slice(0, start)}
      <mark>{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export default function TodoItem({
  todo,
  dispatch,
  onDelete,
  query,
  draggable,
  isDragging,
  onDragStart,
  onDragEnter,
  onDragEnd,
}) {
  const [draft, setDraft] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [subtaskText, setSubtaskText] = useState('');

  const editing = draft !== null;
  const due = describeDue(todo.due, todo.completed);
  const doneSubtasks = todo.subtasks.filter(s => s.done).length;

  const startEdit = () =>
    setDraft({ text: todo.text, priority: todo.priority, due: todo.due, category: todo.category });

  const saveEdit = event => {
    event.preventDefault();
    const text = draft.text.trim();
    if (!text) return;
    dispatch({ type: 'update', id: todo.id, changes: { ...draft, text, category: draft.category.trim() } });
    setDraft(null);
  };

  const addSubtask = event => {
    event.preventDefault();
    const text = subtaskText.trim();
    if (!text) return;
    dispatch({ type: 'addSubtask', id: todo.id, subtask: { id: createId(), text, done: false } });
    setSubtaskText('');
  };

  const classes = [
    'todo',
    todo.completed && 'is-completed',
    isDragging && 'is-dragging',
    editing && 'is-editing',
  ]
    .filter(Boolean)
    .join(' ');

  if (editing) {
    return (
      <li className={classes} data-priority={draft.priority}>
        <form
          className="edit-form"
          onSubmit={saveEdit}
          onKeyDown={e => e.key === 'Escape' && setDraft(null)}
        >
          <input
            className="edit-input"
            value={draft.text}
            onChange={e => setDraft({ ...draft, text: e.target.value })}
            aria-label="Task text"
            maxLength={200}
            autoFocus
          />
          <div className="add-options">
            <PriorityPicker value={draft.priority} onChange={priority => setDraft({ ...draft, priority })} />
            <label className="field">
              <Icon name="calendar" size={16} />
              <input
                type="date"
                value={draft.due}
                onChange={e => setDraft({ ...draft, due: e.target.value })}
                aria-label="Due date"
              />
            </label>
            <label className="field">
              <Icon name="tag" size={16} />
              <input
                list="category-options"
                value={draft.category}
                onChange={e => setDraft({ ...draft, category: e.target.value })}
                placeholder="Category"
                aria-label="Category"
                maxLength={30}
              />
            </label>
          </div>
          <div className="edit-actions">
            <button type="button" className="text-btn" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={!draft.text.trim()}>
              Save
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={classes}
      data-priority={todo.priority}
      draggable={draggable}
      onDragStart={draggable ? e => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', todo.id);
        onDragStart(todo.id);
      } : undefined}
      onDragEnter={draggable ? () => onDragEnter(todo.id) : undefined}
      onDragOver={draggable ? e => e.preventDefault() : undefined}
      onDrop={draggable ? e => e.preventDefault() : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    >
      <div className="todo-main">
        {draggable && (
          <span className="drag-handle" title="Drag to reorder" aria-hidden="true">
            <Icon name="grip" size={16} />
          </span>
        )}

        <input
          type="checkbox"
          className="check"
          checked={todo.completed}
          onChange={() => dispatch({ type: 'toggle', id: todo.id })}
          aria-label={`Mark "${todo.text}" as ${todo.completed ? 'not done' : 'done'}`}
        />

        <div className="todo-body" onDoubleClick={startEdit}>
          <p className="todo-text">
            <Highlight text={todo.text} query={query} />
          </p>
          <div className="meta">
            {todo.priority !== 'none' && (
              <span className={`chip chip-priority priority-${todo.priority}`}>
                <Icon name="flag" size={12} />
                {PRIORITY_LABELS[todo.priority]}
              </span>
            )}
            {due && (
              <span className={`chip chip-due due-${due.status}`}>
                <Icon name="calendar" size={12} />
                {due.status === 'overdue' ? `Overdue · ${due.label}` : due.label}
              </span>
            )}
            {todo.category && (
              <span className="chip chip-category">
                <Icon name="tag" size={12} />
                <Highlight text={todo.category} query={query} />
              </span>
            )}
            {todo.subtasks.length > 0 && (
              <span className={`chip${doneSubtasks === todo.subtasks.length ? ' chip-complete' : ''}`}>
                <Icon name="subtasks" size={12} />
                {doneSubtasks}/{todo.subtasks.length}
              </span>
            )}
          </div>
        </div>

        <div className="todo-actions">
          <button
            type="button"
            className={`icon-btn${expanded ? ' is-active' : ''}`}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label="Subtasks"
            title="Subtasks"
          >
            <Icon name="subtasks" size={17} />
          </button>
          <button type="button" className="icon-btn" onClick={startEdit} aria-label="Edit task" title="Edit">
            <Icon name="edit" size={17} />
          </button>
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => onDelete(todo.id)}
            aria-label="Delete task"
            title="Delete"
          >
            <Icon name="trash" size={17} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="subtasks">
          {todo.subtasks.length > 0 && (
            <div className="subtask-progress" aria-hidden="true">
              <span style={{ width: `${(doneSubtasks / todo.subtasks.length) * 100}%` }} />
            </div>
          )}
          <ul>
            {todo.subtasks.map(sub => (
              <li key={sub.id} className={`subtask${sub.done ? ' is-done' : ''}`}>
                <label>
                  <input
                    type="checkbox"
                    className="check check-sm"
                    checked={sub.done}
                    onChange={() => dispatch({ type: 'toggleSubtask', id: todo.id, subtaskId: sub.id })}
                  />
                  <span>
                    <Highlight text={sub.text} query={query} />
                  </span>
                </label>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => dispatch({ type: 'deleteSubtask', id: todo.id, subtaskId: sub.id })}
                  aria-label={`Delete subtask "${sub.text}"`}
                >
                  <Icon name="x" size={14} />
                </button>
              </li>
            ))}
          </ul>
          <form className="subtask-form" onSubmit={addSubtask}>
            <input
              value={subtaskText}
              onChange={e => setSubtaskText(e.target.value)}
              placeholder="Add a subtask…"
              aria-label="New subtask"
              maxLength={150}
            />
            <button type="submit" className="icon-btn" disabled={!subtaskText.trim()} aria-label="Add subtask">
              <Icon name="plus" size={16} />
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
