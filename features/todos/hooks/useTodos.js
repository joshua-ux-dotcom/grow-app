import { useState, useEffect, useCallback } from 'react';
import {
  getTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
} from '../services/todo';
import { sortTodos } from '../utils/todoUtils';

export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Load ─────────────────────────────────────────
  const loadTodos = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const data = await getTodos();
      setTodos(sortTodos(data));

    } catch (e) {
      console.log('Fehler beim Laden der Todos:', e);
      setError('Todos konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // ─── Stats ────────────────────────────────────────
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progress = totalCount === 0 ? 0 : completedCount / totalCount;

  // ─── Toggle ───────────────────────────────────────
  const toggle = useCallback(async (id, current) => {
    const next = !current;

    // optimistic update
    setTodos(prev =>
      sortTodos(prev.map(t =>
        t.id === id ? { ...t, completed: next } : t
      ))
    );

    try {
      await toggleTodo(id, next);
    } catch {
      // rollback
      setTodos(prev =>
        sortTodos(prev.map(t =>
          t.id === id ? { ...t, completed: current } : t
        ))
      );
    }
  }, []);

  // ─── Delete ───────────────────────────────────────
  const remove = useCallback(async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));

    try {
      await deleteTodo(id);
    } catch {
      loadTodos();
    }
  }, [loadTodos]);

  // ─── Add ──────────────────────────────────────────
  const add = useCallback(async (title, date) => {
    const newTodo = await addTodo(
      title,
      date ? date.toISOString() : null
    );

    setTodos(prev => sortTodos([...prev, newTodo]));
  }, []);

  return {
    todos,
    loading,
    error,
    completedCount,
    totalCount,
    progress,
    loadTodos,
    toggle,
    remove,
    add,
  };
}