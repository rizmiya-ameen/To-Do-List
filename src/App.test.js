import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { STORAGE_KEY, normalizeTodo, sortTodos } from './utils';

beforeEach(() => {
  localStorage.clear();
});

const taskItem = text => screen.getByText(text).closest('li');

test('renders the heading and the sample tasks on first visit', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /to-do list/i })).toBeInTheDocument();
  expect(screen.getByText('Buy more cat food')).toBeInTheDocument();
  expect(screen.getByText('Clean the bathroom')).toBeInTheDocument();
});

test('adds a task with Enter and persists it', () => {
  render(<App />);
  userEvent.type(screen.getByLabelText('New task'), 'Water the plants{enter}');

  expect(screen.getByText('Water the plants')).toBeInTheDocument();
  expect(screen.getByLabelText('New task')).toHaveValue('');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).map(t => t.text)).toContain('Water the plants');
});

test('ignores blank tasks', () => {
  render(<App />);
  const before = screen.getAllByRole('listitem').length;
  userEvent.type(screen.getByLabelText('New task'), '   {enter}');
  expect(screen.getAllByRole('listitem')).toHaveLength(before);
});

test('toggles completion both ways', () => {
  render(<App />);
  const checkbox = within(taskItem('Buy more cat food')).getAllByRole('checkbox')[0];

  userEvent.click(checkbox);
  expect(checkbox).toBeChecked();
  userEvent.click(checkbox);
  expect(checkbox).not.toBeChecked();
});

test('deletes a task and restores it with undo', () => {
  render(<App />);
  userEvent.click(within(taskItem('Finish homework')).getByLabelText('Delete task'));
  expect(screen.queryByText('Finish homework')).not.toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByText('Finish homework')).toBeInTheDocument();
});

test('changes made in a filtered view are kept when showing all', () => {
  render(<App />);
  userEvent.click(screen.getByRole('button', { name: /urgent/i }));
  expect(screen.queryByText('Clean the bathroom')).not.toBeInTheDocument();

  userEvent.click(within(taskItem('Buy more cat food')).getAllByRole('checkbox')[0]);
  userEvent.click(screen.getByRole('button', { name: /^all/i }));

  expect(within(taskItem('Buy more cat food')).getAllByRole('checkbox')[0]).toBeChecked();
  expect(screen.getByText('Clean the bathroom')).toBeInTheDocument();
});

test('searches tasks', () => {
  render(<App />);
  userEvent.type(screen.getByLabelText('Search tasks'), 'bath');
  expect(screen.getByText('bath')).toBeInTheDocument(); // highlighted match
  expect(screen.queryByText('Buy more cat food')).not.toBeInTheDocument();
});

test('edits a task inline', () => {
  render(<App />);
  userEvent.click(within(taskItem('Call grandma')).getByLabelText('Edit task'));
  const input = screen.getByLabelText('Task text');
  userEvent.clear(input);
  userEvent.type(input, 'Call grandpa{enter}');

  expect(screen.getByText('Call grandpa')).toBeInTheDocument();
  expect(screen.queryByText('Call grandma')).not.toBeInTheDocument();
});

test('adds subtasks', () => {
  render(<App />);
  userEvent.click(within(taskItem('Finish homework')).getByLabelText('Subtasks'));
  userEvent.type(screen.getByLabelText('New subtask'), 'Math worksheet{enter}');
  expect(screen.getByText('Math worksheet')).toBeInTheDocument();
  expect(screen.getByText('0/1')).toBeInTheDocument();
});

test('clear completed and reset can be undone', () => {
  render(<App />);
  userEvent.click(screen.getByRole('button', { name: 'Clear completed' }));
  expect(screen.queryByText('Call grandma')).not.toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByText('Your list is empty')).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByText('Buy more cat food')).toBeInTheDocument();
});

test('migrates the old {todo, urgent} shape', () => {
  const todo = normalizeTodo({ todo: 'Old task', urgent: true, completed: false });
  expect(todo).toMatchObject({ text: 'Old task', priority: 'high', completed: false, subtasks: [] });
  expect(normalizeTodo({ todo: '   ' })).toBeNull();
});

test('keeps completed tasks last when sorting', () => {
  const list = [
    { text: 'b', completed: true, priority: 'high' },
    { text: 'a', completed: false, priority: 'low' },
    { text: 'c', completed: false, priority: 'high' },
  ].map(normalizeTodo);
  expect(sortTodos(list, 'priority').map(t => t.text)).toEqual(['c', 'a', 'b']);
});
