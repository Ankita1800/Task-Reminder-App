/**
 * =============================================================================
 * NOTIFICATION UTILITY MODULE
 * =============================================================================
 * 
 * WHY SEPARATE INTO utils/notification.js?
 * -----------------------------------------
 * 1. SEPARATION OF CONCERNS: Notification logic is platform-specific (Browser API)
 *    and should not pollute React component/context code
 * 
 * 2. REUSABILITY: Any component can import and use notifications without
 *    duplicating permission logic
 * 
 * 3. TESTABILITY: Pure functions are easier to unit test in isolation
 * 
 * 4. MAINTAINABILITY: If we switch to a different notification system 
 *    (e.g., push notifications via Service Worker), we only change this file
 * 
 * 5. SINGLE RESPONSIBILITY PRINCIPLE: This module does ONE thing - notifications
 * 
 * BROWSER NOTIFICATION API LIMITATIONS:
 * -------------------------------------
 * - Requires HTTPS in production (except localhost)
 * - User must grant permission explicitly
 * - Browser tab must be open for basic notifications (not PWA)
 * - Notifications may be blocked by OS-level settings
 * - Different browsers have different notification styles/behaviors
 * 
 * PWA vs BROWSER TAB:
 * -------------------
 * - Browser Tab: Notifications only work when tab is open
 * - PWA with Service Worker: Can receive push notifications even when closed
 * - This MVP uses browser-based; PWA upgrade requires serviceWorker.js
 */

/**
 * Request notification permission from user
 * @returns {Promise<string>} - 'granted', 'denied', or 'default'
 * 
 * INTERVIEW EXPLANATION:
 * We request permission explicitly rather than on page load because:
 * 1. Better UX - user understands WHY we need permission
 * 2. Higher grant rate when tied to user action
 * 3. Follows browser best practices (Chrome penalizes aggressive permission requests)
 */
export async function requestNotificationPermission() {
  // Check if browser supports notifications
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return "unsupported";
  }

  // Already granted - no need to ask again
  if (Notification.permission === "granted") {
    return "granted";
  }

  // Already denied - can't ask again (browser restriction)
  if (Notification.permission === "denied") {
    console.warn("Notifications were previously denied by user");
    return "denied";
  }

  // Request permission (returns promise in modern browsers)
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    // Fallback for older browsers that use callback syntax
    return new Promise((resolve) => {
      Notification.requestPermission((permission) => {
        resolve(permission);
      });
    });
  }
}

/**
 * Show a notification to the user
 * @param {string} title - Notification title
 * @param {object} options - Notification options (body, icon, tag, etc.)
 * 
 * OPTIONS EXPLAINED:
 * - body: Main message text
 * - icon: Small image (fallback to app icon)
 * - tag: Unique ID to prevent duplicate notifications
 * - requireInteraction: Keep notification until user interacts (desktop only)
 * - silent: Don't play sound
 */
export function showNotification(title, options = {}) {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  const defaultOptions = {
    icon: "/icon.svg",
    badge: "/icon.svg",
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    requireInteraction: false,
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
    
    // Handle click - focus the app
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error("Failed to show notification:", error);
    return null;
  }
}

/**
 * Show notification for overdue task
 * @param {object} task - Task object with title and deadline
 * 
 * WHY SEPARATE FUNCTION?
 * We create specific notification functions for different events because:
 * 1. Consistent messaging across the app
 * 2. Easy to customize notification style per event type
 * 3. Analytics tracking can be added per notification type
 */
export function notifyOverdueTask(task) {
  return showNotification("⚠️ Task Overdue!", {
    body: `"${task.title}" was due at ${new Date(task.deadline).toLocaleString()}`,
    tag: `overdue-${task.id}`, // Prevents duplicate notifications for same task
    requireInteraction: true,  // Important notifications should persist
  });
}

/**
 * Show notification for task completion
 * @param {object} task - Completed task object
 */
export function notifyTaskCompleted(task) {
  return showNotification("✅ Task Completed!", {
    body: `Great job completing "${task.title}"!`,
    tag: `completed-${task.id}`,
  });
}

/**
 * Show daily summary notification
 * @param {number} completed - Number of completed tasks
 * @param {number} total - Total tasks for the day
 */
export function notifyDailySummary(completed, total) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;
  const emoji = percentage >= 80 ? "🔥" : percentage >= 50 ? "👍" : "💪";
  
  return showNotification(`${emoji} Daily Summary`, {
    body: `You completed ${completed}/${total} tasks (${percentage}%)`,
    tag: "daily-summary",
  });
}

/**
 * Check if notifications are available and permitted
 * @returns {boolean}
 */
export function canShowNotifications() {
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Get current notification permission status
 * @returns {string} - 'granted', 'denied', 'default', or 'unsupported'
 */
export function getNotificationStatus() {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}
