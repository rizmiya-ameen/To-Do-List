import { forwardRef, useState } from 'react';
import Icon from './Icon';
import PriorityPicker from './PriorityPicker';

const AddTodo = forwardRef(function AddTodo({ onAdd }, inputRef) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('none');
  const [due, setDue] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = event => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd({ text: trimmed, priority, due, category: category.trim() });
    setText('');
    setPriority('none');
    setDue('');
  };

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <div className="add-row">
        <input
          ref={inputRef}
          className="add-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What needs to be done?"
          aria-label="New task"
          maxLength={200}
        />
        <button type="submit" className="add-btn" disabled={!text.trim()} aria-label="Add task" title="Add task">
          <Icon name="plus" size={22} />
        </button>
      </div>

      <div className="add-options">
        <PriorityPicker value={priority} onChange={setPriority} />
        <label className="field">
          <Icon name="calendar" size={16} />
          <input type="date" value={due} onChange={e => setDue(e.target.value)} aria-label="Due date" />
        </label>
        <label className="field">
          <Icon name="tag" size={16} />
          <input
            list="category-options"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Category"
            aria-label="Category"
            maxLength={30}
          />
        </label>
      </div>
    </form>
  );
});

export default AddTodo;
