/**
 * =============================================================================
 * TASK CONTEXT - Central State Management
 * =============================================================================
 * 
 * WHY REACT CONTEXT INSTEAD OF REDUX?
 * ------------------------------------
 * 1. SIMPLICITY: No boilerplate (actions, reducers, store setup)
 * 2. BUILT-IN: Part of React, no external dependencies
 * 3. SUFFICIENT: For apps with <10 state slices, Context is enough
 * 4. LEARNING CURVE: Easier for small teams to maintain
 * 
 * WHEN TO USE REDUX:
 * - Complex state logic (many reducers)
 * - Need middleware (logging, async)
 * - Large team needing strict patterns
 * - Time-travel debugging requirement
 * 
 * STATE STRUCTURE:
 * ----------------
 * tasks: Array of task objects
 * streak: Number of consecutive completions
 * 
 * INTERVIEW TIP:
 * "I chose Context over Redux because the app has simple state requirements.
 * Context eliminates boilerplate while providing the same global state access.
 * If the app scales to need complex async operations or middleware, 
 * migrating to Redux Toolkit would be straightforward."
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { notifyTaskCompleted } from "../utils/notification";
import { getTodayKey, isOverdue, getStartOfToday } from "../utils/dateUtils";

// Create context with default value
export const TaskContext = createContext(null);

/**
 * Custom hook for consuming TaskContext
 * 
 * WHY CUSTOM HOOK?
 * - Encapsulates useContext call
 * - Provides error if used outside provider
 * - Better TypeScript support
 * - Single import for consumers
 */
export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}

// Storage keys as constants (prevents typos)
const STORAGE_KEYS = {
  TASKS: "task-reminder-tasks",
  STREAK: "task-reminder-streak",
  LAST_CHECK: "task-reminder-last-check",
};

export const TaskProvider = ({ children }) => {
  /**
   * LAZY INITIALIZATION PATTERN
   * 
   * WHY () => localStorage.getItem() INSTEAD OF localStorage.getItem()?
   * - Function only runs ONCE on initial render
   * - Direct call runs on EVERY render (wasteful)
   * - Improves initial load performance
   */
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to load tasks:", error);
      return [];
    }
  });

  const [streak, setStreak] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STREAK);
      return saved ? JSON.parse(saved) : 0;
    } catch (error) {
      return 0;
    }
  });

  /**
   * PERSIST TASKS TO localStorage
   * 
   * WHY useEffect FOR PERSISTENCE?
   * -----------------------------
   * 1. State changes trigger useEffect
   * 2. useEffect runs AFTER render (non-blocking)
   * 3. Batches rapid updates into single write
   * 4. Separates "what data is" from "where it's stored"
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error("Failed to save tasks:", error);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streak));
    } catch (error) {
      console.error("Failed to save streak:", error);
    }
  }, [streak]);

  /**
   * Add a new task
   * 
   * TASK STRUCTURE:
   * - id: Unique identifier (timestamp-based)
   * - title: Task name
   * - deadline: ISO datetime string
   * - completed: Boolean status
   * - createdAt: When task was created
   * - notified: Whether overdue notification was sent
   */
  const addTask = useCallback((task) => {
    const newTask = {
      id: Date.now(),
      title: task.title,
      deadline: task.deadline,
      completed: false,
      createdAt: new Date().toISOString(),
      notified: false,
    };
    
    setTasks(prev => [...prev, newTask]);
    console.log(`[Task] Added: "${task.title}"`);
  }, []);

  /**
   * Complete a task
   * 
   * SIDE EFFECTS:
   * 1. Updates task status
   * 2. Increments streak
   * 3. Shows celebration notification
   */
  const completeTask = useCallback((id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task && !task.completed) {
        // Show notification
        notifyTaskCompleted(task);
        
        // Increment streak
        setStreak(s => s + 1);
        
        console.log(`[Task] Completed: "${task.title}"`);
      }
      
      return prev.map(t =>
        t.id === id 
          ? { ...t, completed: true, completedAt: new Date().toISOString() } 
          : t
      );
    });
  }, []);

  /**
   * Delete a task
   */
  const deleteTask = useCallback((id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task) {
        console.log(`[Task] Deleted: "${task.title}"`);
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  /**
   * Mark task as notified (prevents duplicate notifications)
   */
  const markNotified = useCallback((id) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, notified: true } : t))
    );
  }, []);

  /**
   * Get tasks due today
   */
  const getTodayTasks = useCallback(() => {
    const startOfToday = getStartOfToday();
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    return tasks.filter(task => {
      const deadline = new Date(task.deadline);
      return deadline >= startOfToday && deadline <= endOfToday;
    });
  }, [tasks]);

  /**
   * Get overdue tasks
   */
  const getOverdueTasks = useCallback(() => {
    return tasks.filter(task => !task.completed && isOverdue(task.deadline));
  }, [tasks]);

  /**
   * DISCIPLINE SCORE CALCULATION
   * 
   * Formula: (completed / total) * 100
   * 
   * Edge cases:
   * - No tasks: 100% (nothing to fail)
   * - All completed: 100%
   * - All missed: 0%
   */
  const disciplineScore = tasks.length === 0
    ? 100
    : Math.round(
        (tasks.filter(t => t.completed).length / tasks.length) * 100
      );

  /**
   * Get pending (not completed, not overdue) tasks count
   */
  const pendingCount = tasks.filter(t => !t.completed && !isOverdue(t.deadline)).length;
  
  /**
   * Get overdue tasks count
   */
  const overdueCount = tasks.filter(t => !t.completed && isOverdue(t.deadline)).length;

  /**
   * Clear all tasks (for testing/reset)
   */
  const clearAllTasks = useCallback(() => {
    setTasks([]);
    setStreak(0);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.STREAK);
  }, []);

  /**
   * CONTEXT VALUE
   * 
   * WHY NOT SPREAD ALL STATE?
   * - Explicit API is clearer
   * - Easier to document/type
   * - Prevents accidental exposure
   */
  const value = {
    // State
    tasks,
    streak,
    disciplineScore,
    pendingCount,
    overdueCount,
    
    // Actions
    addTask,
    completeTask,
    deleteTask,
    markNotified,
    clearAllTasks,
    
    // Computed
    getTodayTasks,
    getOverdueTasks,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
