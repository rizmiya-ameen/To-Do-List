import { useEffect } from 'react';
import Icon from './Icon';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="toast" role="status" key={toast.key}>
      <span>{toast.message}</span>
      {toast.undo && (
        <button
          type="button"
          className="toast-undo"
          onClick={() => {
            toast.undo();
            onClose();
          }}
        >
          Undo
        </button>
      )}
      <button type="button" className="icon-btn toast-close" onClick={onClose} aria-label="Dismiss">
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
