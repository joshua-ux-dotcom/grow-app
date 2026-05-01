export function isUrgent(dueAt, completed) {
  if (!dueAt || completed) return false;

  const diff = new Date(dueAt) - new Date();
  return diff > 0 && diff < 60 * 60 * 1000;
}

export function isOverdue(dueAt, completed) {
  if (!dueAt || completed) return false;

  return new Date(dueAt) < new Date();
}

export function formatDueLabel(dueAt, completed) {
  if (!dueAt) return null;

  const dueDate = new Date(dueAt);
  const diff = dueDate - new Date();

  if (!completed && diff < 0) {
    return 'Überfällig';
  }

  if (!completed && diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / 60000);
    return `Noch ${minutes} Min.`;
  }

  const timeText = dueDate.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isToday = dueDate.toDateString() === new Date().toDateString();

  if (isToday) {
    return `Heute um ${timeText}`;
  }

  const dateText = dueDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
  });

  return `${dateText} um ${timeText}`;
}

export function sortTodos(todos) {
  const incompleteTodos = todos
    .filter((todo) => !todo.completed)
    .sort((a, b) => {
      if (!a.due_at && !b.due_at) return 0;
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;

      return new Date(a.due_at) - new Date(b.due_at);
    });

  const completedTodos = todos.filter((todo) => todo.completed);

  return [...incompleteTodos, ...completedTodos];
}