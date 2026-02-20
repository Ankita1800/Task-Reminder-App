/**
 * =============================================================================
 * HISTORY CONTEXT - Daily Performance Tracking
 * =============================================================================
 * 
 * PURPOSE:
 * --------
 * Track daily task completion/missed counts for:
 * 1. Historical analytics and charts
 * 2. Recovery logic (yesterday's debt carries over)
 * 3. Streak calculation
 * 4. Long-term behavioral insights
 * 
 * DATA STRUCTURE:
 * ---------------
 * {
 *   "2026-02-20": { completed: 5, missed: 2 },
 *   "2026-02-19": { completed: 3, missed: 1 },
 *   ...
 * }
 * 
 * WHY localStorage INSTEAD OF DATABASE (MVP):
 * -------------------------------------------
 * 1. ZERO BACKEND COST: No server, no database fees
 * 2. OFFLINE FIRST: Works without internet connection
 * 3. INSTANT READS: No network latency
 * 4. PRIVACY: Data stays on user's device
 * 5. SIMPLICITY: No auth, no API calls, no CORS
 * 
 * LIMITATIONS OF localStorage:
 * ----------------------------
 * 1. ~5MB limit per domain
 * 2. No sync across devices
 * 3. Cleared if user clears browser data
 * 4. Not suitable for sensitive data (not encrypted)
 * 
 * MIGRATION PATH TO DATABASE:
 * ---------------------------
 * When scaling to MongoDB + Express:
 * 1. Create /api/history endpoints
 * 2. Replace localStorage calls with fetch()
 * 3. Add user authentication
 * 4. Sync local data on login
 * 
 * WHY SEPARATE CONTEXT FROM TaskContext:
 * --------------------------------------
 * 1. SINGLE RESPONSIBILITY: TaskContext = task CRUD, HistoryContext = analytics
 * 2. PERFORMANCE: History updates don't re-render task list
 * 3. MODULARITY: Can disable history feature without affecting tasks
 * 4. SCALABILITY: Easy to add new analytics without bloating task logic
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getTodayKey, getYesterdayKey } from "../utils/dateUtils";

// Create context
export const HistoryContext = createContext();

// Custom hook for easy access
export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}

// Storage key constant
const HISTORY_STORAGE_KEY = "task-reminder-history";

export function HistoryProvider({ children }) {
  /**
   * STATE INITIALIZATION WITH LAZY LOADING
   * 
   * WHY FUNCTION IN useState?
   * - Prevents localStorage.getItem running on every render
   * - Only runs once during initial mount
   * - Better performance for expensive initialization
   */
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Failed to load history from localStorage:", error);
      return {};
    }
  });

  /**
   * PERSIST TO localStorage ON CHANGE
   * 
   * WHY useEffect FOR PERSISTENCE?
   * - React state is the "source of truth"
   * - localStorage is a "side effect" (external system)
   * - useEffect handles side effects after render
   * - Batches multiple state updates into single write
   */
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage:", error);
      // Could be quota exceeded - handle gracefully
      if (error.name === "QuotaExceededError") {
        // Remove oldest entries to make space
        const keys = Object.keys(history).sort();
        if (keys.length > 30) {
          const trimmedHistory = {};
          keys.slice(-30).forEach(key => {
            trimmedHistory[key] = history[key];
          });
          setHistory(trimmedHistory);
        }
      }
    }
  }, [history]);

  /**
   * Record a completed task for today
   * 
   * WHY useCallback?
   * - Memoizes function reference
   * - Prevents unnecessary re-renders in child components
   * - Safe to use in dependency arrays
   */
  const recordCompletion = useCallback(() => {
    const today = getTodayKey();
    setHistory(prev => ({
      ...prev,
      [today]: {
        completed: (prev[today]?.completed || 0) + 1,
        missed: prev[today]?.missed || 0,
      }
    }));
  }, []);

  /**
   * Record a missed task for today
   */
  const recordMissed = useCallback(() => {
    const today = getTodayKey();
    setHistory(prev => ({
      ...prev,
      [today]: {
        completed: prev[today]?.completed || 0,
        missed: (prev[today]?.missed || 0) + 1,
      }
    }));
  }, []);

  /**
   * Get today's statistics
   * 
   * OPTIONAL CHAINING EXPLAINED (history[key]?.missed):
   * - If history[key] is undefined, returns undefined (not error)
   * - Prevents "Cannot read property 'missed' of undefined"
   * - Cleaner than: history[key] && history[key].missed
   */
  const getTodayStats = useCallback(() => {
    const today = getTodayKey();
    return {
      completed: history[today]?.completed || 0,
      missed: history[today]?.missed || 0,
    };
  }, [history]);

  /**
   * Get yesterday's statistics (for recovery logic)
   */
  const getYesterdayStats = useCallback(() => {
    const yesterday = getYesterdayKey();
    return {
      completed: history[yesterday]?.completed || 0,
      missed: history[yesterday]?.missed || 0,
    };
  }, [history]);

  /**
   * Calculate recovery debt
   * 
   * RECOVERY LOGIC EXPLAINED:
   * -------------------------
   * If user missed 3 tasks yesterday, they need to complete
   * 3 EXTRA tasks today to "recover" their discipline.
   * 
   * This creates accountability:
   * - Can't just ignore missed tasks
   * - Yesterday's failure affects today's goal
   * - Behavioral reinforcement through consequence
   */
  const getRecoveryDebt = useCallback(() => {
    const yesterday = getYesterdayKey();
    return history[yesterday]?.missed || 0;
  }, [history]);

  /**
   * Get statistics for last N days
   */
  const getRecentStats = useCallback((days = 7) => {
    const stats = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      stats.push({
        date: key,
        ...history[key] || { completed: 0, missed: 0 },
      });
    }
    return stats.reverse(); // Chronological order
  }, [history]);

  /**
   * Calculate overall completion rate
   */
  const getOverallCompletionRate = useCallback(() => {
    const entries = Object.values(history);
    if (entries.length === 0) return 100;

    const totals = entries.reduce(
      (acc, day) => ({
        completed: acc.completed + (day.completed || 0),
        missed: acc.missed + (day.missed || 0),
      }),
      { completed: 0, missed: 0 }
    );

    const total = totals.completed + totals.missed;
    return total > 0 ? Math.round((totals.completed / total) * 100) : 100;
  }, [history]);

  /**
   * Clear all history (for testing/reset)
   */
  const clearHistory = useCallback(() => {
    setHistory({});
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }, []);

  const value = {
    history,
    recordCompletion,
    recordMissed,
    getTodayStats,
    getYesterdayStats,
    getRecoveryDebt,
    getRecentStats,
    getOverallCompletionRate,
    clearHistory,
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}
