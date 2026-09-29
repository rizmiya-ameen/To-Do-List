import { plural } from '../utils';

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Progress({ done, total, overdue }) {
  const percent = total ? Math.round((done / total) * 100) : 0;

  let message;
  if (!total) message = "A fresh start. What's first?";
  else if (done === total) message = 'All done. Nice work! 🎉';
  else if (overdue) message = `${overdue} overdue ${plural(overdue, 'task')}. Let's catch up.`;
  else if (percent >= 50) message = 'More than halfway there!';
  else message = 'One step at a time.';

  return (
    <section className="progress" aria-label="Progress">
      <div className="ring">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r={RADIUS} className="ring-track" />
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            className="ring-fill"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
          />
        </svg>
        <span className="ring-label">{percent}%</span>
      </div>
      <div>
        <p className="progress-title">
          {done} of {total} {plural(total, 'task')} done
        </p>
        <p className="progress-sub">{message}</p>
      </div>
    </section>
  );
}
