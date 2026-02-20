/**
 * =============================================================================
 * APP.JSX - Application Root
 * =============================================================================
 * 
 * COMPONENT HIERARCHY:
 * --------------------
 * App
 * └── HistoryProvider    ← Analytics & recovery data
 *     └── TaskProvider   ← Task CRUD & state
 *         └── AppContent ← Main app with hooks
 *             └── Dashboard
 * 
 * WHY THIS ORDER?
 * ---------------
 * - HistoryProvider is outermost so TaskProvider can access it
 * - This allows tasks to record to history on completion
 * - Inner components can access both contexts
 * 
 * PROVIDER PATTERN EXPLAINED:
 * ---------------------------
 * Providers wrap the app tree, making state available to all descendants.
 * This avoids "prop drilling" (passing props through many levels).
 */

import { useEffect } from "react";
import { TaskProvider, useTaskContext } from "./context/TaskContext";
import { HistoryProvider, useHistory } from "./context/HistoryContext";
import { useAutoCheck } from "./hooks/useAutoCheck";
import { requestNotificationPermission } from "./utils/notification";
import Dashboard from "./pages/Dashboard";

/**
 * AppContent - Inner component that uses hooks
 * 
 * WHY SEPARATE FROM App?
 * ----------------------
 * Hooks can only be called inside components that are INSIDE providers.
 * If we call useTaskContext in App directly, it would be OUTSIDE TaskProvider.
 * 
 * CORRECT:  Provider → Child uses useContext
 * WRONG:    useContext → Provider (context not available yet)
 */
function AppContent() {
  const { tasks } = useTaskContext();
  const { recordMissed, getRecoveryDebt } = useHistory();

  /**
   * Request notification permission on mount
   * 
   * WHY ON MOUNT?
   * - Establishes notification capability early
   * - User can deny if they want, we'll handle it
   * - Better than asking mid-task when they're focused
   */
  useEffect(() => {
    requestNotificationPermission().then(permission => {
      console.log(`[Notifications] Permission: ${permission}`);
    });
  }, []);

  /**
   * Log recovery debt on mount (for debugging)
   */
  useEffect(() => {
    const debt = getRecoveryDebt();
    if (debt > 0) {
      console.log(`[Recovery] You have ${debt} tasks to recover from yesterday`);
    }
  }, [getRecoveryDebt]);

  /**
   * Auto-check hook for deadline monitoring
   * 
   * When a task becomes overdue:
   * 1. Notification is shown (in the hook)
   * 2. recordMissed() updates history
   */
  useAutoCheck(tasks, (overdueTask) => {
    recordMissed();
    console.log(`[History] Recorded missed task: "${overdueTask.title}"`);
  });

  return <Dashboard />;
}

/**
 * App - Root component with providers
 */
function App() {
  return (
    <HistoryProvider>
      <TaskProvider>
        <AppContent />
      </TaskProvider>
    </HistoryProvider>
  );
}

export default App;
