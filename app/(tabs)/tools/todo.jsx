import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const INITIAL_TODOS = [
  { id: '1', title: 'Morgens kalt duschen', completed: true },
  { id: '2', title: 'Workout beenden', completed: true },
  { id: '3', title: '30 Min. lesen', completed: true },
  { id: '4', title: 'Intervallfasten 18/6', completed: true },
  { id: '5', title: '1h Deep Work', completed: false },
  { id: '6', title: 'Zucker komplett vermeiden', completed: false },
];

export default function TodoScreen() {
  const [todos, setTodos] = useState(INITIAL_TODOS);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;
  const progress = totalCount === 0 ? 0 : completedCount / totalCount;

  function toggleTodo(id) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  }

  function addTodo() {
    const newTodo = {
      id: Date.now().toString(),
      title: 'Neue Aufgabe',
      completed: false,
    };

    setTodos((currentTodos) => [newTodo, ...currentTodos]);
  }

  function deleteTodo(id) {
    setTodos((currentTodos) =>
      currentTodos.filter((todo) => todo.id !== id)
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={44} color="#D4AF37" />
          </View>

          <Text style={styles.title}>TO-DO</Text>
          <Text style={styles.subtitle}>
            Erledige deine Aufgaben. Gewinne deinen Tag.
          </Text>
        </View>

        <View style={styles.todayRow}>
          <Text style={styles.sectionTitle}>HEUTE</Text>
          <Text style={styles.counter}>
            {completedCount}/{totalCount} Aufgaben
          </Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.list}>
          {todos.map((todo) => (
            <Pressable
              key={todo.id}
              onPress={() => toggleTodo(todo.id)}
              onLongPress={() => deleteTodo(todo.id)}
              style={[
                styles.todoCard,
                todo.completed && styles.todoCardDone,
              ]}
            >
              <View style={styles.todoLeft}>
                <View
                  style={[
                    styles.checkbox,
                    todo.completed && styles.checkboxDone,
                  ]}
                >
                  {todo.completed && (
                    <Ionicons name="checkmark" size={16} color="#050505" />
                  )}
                </View>

                <View>
                  <Text
                    style={[
                      styles.todoTitle,
                      todo.completed && styles.todoTitleDone,
                    ]}
                  >
                    {todo.title}
                  </Text>
                  <Text style={styles.todoSub}>
                    {todo.completed ? 'Abgeschlossen' : 'fällig heute 23:59'}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addPlus}>+</Text>
          <Text style={styles.addText}>Neue Aufgabe hinzufügen</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingTop: 70,
    paddingHorizontal: 22,
    paddingBottom: 120,
  },

  header: {
    alignItems: 'center',
    marginBottom: 34,
  },

  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },

  title: {
    color: '#F2D48A',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 3,
  },

  subtitle: {
    color: '#D8C7A3',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },

  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#F2D48A',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },

  counter: {
    color: '#E8C97A',
    fontSize: 15,
    fontWeight: '600',
  },

  progressCard: {
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
  },

  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 999,
  },

  list: {
    gap: 12,
  },

  todoCard: {
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },

  todoTitleDone: {
    color: '#C8B78E',
    textDecorationLine: 'line-through',
  },

  todoCardDone: {
    borderColor: 'rgba(212, 175, 55, 0.45)',
    backgroundColor: 'rgba(212, 175, 55, 0.07)',
  },

  todoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#B8924B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxDone: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },

  todoTitle: {
    color: '#F4E7C5',
    fontSize: 18,
    fontWeight: '700',
  },

  todoSub: {
    color: '#A99B84',
    fontSize: 13,
    marginTop: 4,
  },

  addButton: {
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  addPlus: {
    color: '#D4AF37',
    fontSize: 26,
    fontWeight: '300',
  },

  addText: {
    color: '#F2D48A',
    fontSize: 17,
    fontWeight: '700',
  },
});