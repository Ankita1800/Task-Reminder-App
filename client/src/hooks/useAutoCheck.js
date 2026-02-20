/**
 * =============================================================================
 * AUTO-CHECK HOOK - Time-Based Deadline Monitoring
 * =============================================================================
 * 
 * PURPOSE:
 * --------
 * Automatically check for overdue tasks at regular intervals and:
 * 1. Trigger notifications for newly overdue tasks
 * 2. Update history with missed tasks
 * 3. Track which tasks have already been notified
 * 
 * WHY 60000ms (1 MINUTE) INTERVAL?
 * --------------------------------
 * Trade-off between responsiveness and performance:
 * 
 * - 1 second (1000ms): Too aggressive, wastes CPU cycles
 * - 1 minute (60000ms): Good balance - deadlines are usually in hours/days
 * - 5 minutes (300000ms): Too slow - user might miss important deadlines
 * 
 * PERFORMANCE CONSIDERATIONS:
 * ---------------------------
 * 1. setInterval runs in main thread (JavaScript is single-threaded)
 * 2. Heavy computation blocks UI - keep check function lightweight
 * 3. Filter/map operations are O(n) - fine for <1000 tasks
 * 4. For larger datasets: Web Workers or server-side checking
 * 
 * WHY setInterval + useEffect CLEANUP?
 * ------------------------------------
 * - setInterval creates a timer that runs indefinitely
 * - If component unmounts without cleanup, timer keeps running
 * - This causes memory leaks and bugs (updating unmounted component)
 * - useEffect's cleanup function runs on unmount
 * - clearInterval stops the timer properly
 * 
 * COMPONENT LIFECYCLE:
 * -------------------
 * Mount → Start interval → [check every minute] → Unmount → Clear interval
 */

import { useEffect, useRef, useCallback } from "react";
import { notifyOverdueTask } from "../utils/notification";
import { isOverdue } from "../utils/dateUtils";

/**
 * Custom hook for automatic deadline checking
 * 
 * @param {Array} tasks - Array of task objects
 * @param {Function} onTaskOverdue - Callback when task becomes overdue
 * @param {number} intervalMs - Check interval in milliseconds (default: 60000)
 * 
 * WHY CUSTOM HOOK?
 * ----------------
 * 1. Encapsulates complex logic (interval, cleanup, tracking)
 * 2. Reusable across different components
 * 3. Follows React patterns (hooks composition)
 * 4. Testable in isolation
 */
export function useAutoCheck(tasks, onTaskOverdue, intervalMs = 60000) {
  /**
   * useRef for tracking notified tasks
   * 
   * WHY useRef INSTEAD OF useState?
   * - We don't need re-renders when this changes
   * - useRef persists across renders without causing re-render
   * - Mutable: notifiedRef.current can be modified directly
   * - Better performance for high-frequency updates
   */
  const notifiedTasksRef = useRef(new Set());

  /**
   * Check function - runs every interval
   */
  const checkOverdueTasks = useCallback(() => {
    if (!tasks || tasks.length === 0) return;

    const now = new Date();

    tasks.forEach(task => {
      // Skip if already completed
      if (task.completed) return;

      // Skip if already notified
      if (notifiedTasksRef.current.has(task.id)) return;

      // Check if task is now overdue
      if (isOverdue(task.deadline)) {
        // Mark as notified to prevent duplicate notifications
        notifiedTasksRef.current.add(task.id);

        // Show notification
        notifyOverdueTask(task);

        // Call callback for history tracking
        if (onTaskOverdue) {
          onTaskOverdue(task);
        }

        console.log(`[AutoCheck] Task overdue: "${task.title}"`);
      }
    });
  }, [tasks, onTaskOverdue]);

  /**
   * Initial check on mount and when tasks change
   */
  useEffect(() => {
    // Run check immediately
    checkOverdueTasks();
  }, [checkOverdueTasks]);

  /**
   * Set up interval for periodic checking
   * 
   * CLEANUP PATTERN EXPLAINED:
   * --------------------------
   * useEffect(() => {
   *   const id = setInterval(...);   // Setup
   *   return () => clearInterval(id); // Cleanup
   * }, [deps]);
   * 
   * React calls cleanup:
   * 1. Before running effect again (when deps change)
   * 2. When component unmounts
   */
  useEffect(() => {
    console.log(`[AutoCheck] Starting interval (${intervalMs}ms)`);

    const intervalId = setInterval(() => {
      checkOverdueTasks();
    }, intervalMs);

    // Cleanup function - CRITICAL for preventing memory leaks
    return () => {
      console.log("[AutoCheck] Clearing interval");
      clearInterval(intervalId);
    };
  }, [checkOverdueTasks, intervalMs]);

  /**
   * Manual check function (for button trigger)
   */
  const forceCheck = useCallback(() => {
    checkOverdueTasks();
  }, [checkOverdueTasks]);

  /**
   * Reset notification tracking (for testing)
   */
  const resetNotifications = useCallback(() => {
    notifiedTasksRef.current.clear();
  }, []);

  return {
    forceCheck,
    resetNotifications,
    notifiedCount: notifiedTasksRef.current.size,
  };
}

/**
 * =============================================================================
 * ALTERNATIVE IMPLEMENTATION DISCUSSION
 * =============================================================================
 * 
 * APPROACH 1: setInterval (Current)
 * - Pros: Simple, works offline, no server required
 * - Cons: Stops if tab is inactive (browser throttles)
 * 
 * APPROACH 2: setTimeout recursion
 * - Pros: More control over timing, can adjust based on load
 * - Cons: More complex, same browser throttling issue
 * 
 * APPROACH 3: requestAnimationFrame
 * - Pros: Synced with display refresh
 * - Cons: Not meant for time-based logic, pauses when tab hidden
 * 
 * APPROACH 4: Web Worker
 * - Pros: Runs in background thread, not throttled
 * - Cons: More complex setup, can't access DOM directly
 * 
 * APPROACH 5: Service Worker + Push
 * - Pros: Works even when app closed, true push notifications
 * - Cons: Requires server, HTTPS, more infrastructure
 * 
 * FOR MVP: setInterval is the right choice
 * FOR PRODUCTION: Service Worker + Push notifications
 */

export default useAutoCheck;
