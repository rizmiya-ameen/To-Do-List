import Icon from './Icon';
import { SORTS, VIEWS } from '../utils';

export default function Toolbar({
  searchRef,
  search,
  onSearch,
  view,
  onView,
  counts,
  categories,
  category,
  onCategory,
  sort,
  onSort,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <label className="search">
          <Icon name="search" size={16} />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={e => onSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                onSearch('');
                e.currentTarget.blur();
              }
            }}
            placeholder="Search tasks"
            aria-label="Search tasks"
          />
        </label>

        {categories.length > 0 && (
          <label className="select">
            <Icon name="tag" size={15} />
            <select value={category} onChange={e => onCategory(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="select">
          <span className="select-label">Sort</span>
          <select value={sort} onChange={e => onSort(e.target.value)} aria-label="Sort tasks">
            {SORTS.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav className="views" aria-label="Filter tasks">
        {VIEWS.map(v => (
          <button
            key={v.id}
            type="button"
            className={`view-tab${view === v.id ? ' is-active' : ''}${
              v.id === 'overdue' && counts.overdue ? ' has-alert' : ''
            }`}
            aria-pressed={view === v.id}
            onClick={() => onView(v.id)}
          >
            {v.label}
            <span className="badge">{counts[v.id]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
