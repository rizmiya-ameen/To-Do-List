import { useId } from 'react';
import { PRIORITIES, PRIORITY_LABELS } from '../utils';

export default function PriorityPicker({ value, onChange }) {
  const name = useId();
  return (
    <div className="priority-picker" role="radiogroup" aria-label="Priority">
      {PRIORITIES.map(p => (
        <label key={p} className={`priority-option${value === p ? ' is-active' : ''}`} data-priority={p}>
          <input type="radio" name={name} value={p} checked={value === p} onChange={() => onChange(p)} />
          <span className="dot" aria-hidden="true" />
          {PRIORITY_LABELS[p]}
        </label>
      ))}
    </div>
  );
}
