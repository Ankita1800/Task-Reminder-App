/**
 * =============================================================================
 * DATE UTILITY MODULE
 * =============================================================================
 * 
 * WHY SEPARATE DATE UTILITIES?
 * ----------------------------
 * 1. Date manipulation is error-prone (timezones, DST, edge cases)
 * 2. Centralizing date logic ensures consistency
 * 3. Easy to switch to a library (date-fns, dayjs) later
 * 4. Testable in isolation
 * 
 * ISO DATE FORMAT (YYYY-MM-DD):
 * -----------------------------
 * We use ISO 8601 format because:
 * 1. Universally understood
 * 2. Sorts correctly as strings
 * 3. No timezone ambiguity for date-only values
 * 4. Easy to parse and compare
 */

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 * @returns {string} - e.g., "2026-02-20"
 * 
 * WHY toISOString().split('T')[0]?
 * - toISOString() returns "2026-02-20T05:30:00.000Z"
 * - split('T')[0] extracts just the date part
 * - This ignores timezone issues for date-only comparisons
 */
export function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date in ISO format
 * @returns {string} - e.g., "2026-02-19"
 * 
 * SAFE CALCULATION:
 * - We subtract 86400000ms (24 hours) from current time
 * - This handles month/year boundaries correctly
 * - Alternative: new Date(Date.now() - 86400000)
 */
export function getYesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Get a date key for N days ago
 * @param {number} daysAgo - Number of days to go back
 * @returns {string} - ISO date string
 */
export function getDateKeyDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Check if a deadline has passed
 * @param {string|Date} deadline - Task deadline
 * @returns {boolean}
 */
export function isOverdue(deadline) {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  return deadlineDate < now;
}

/**
 * Check if a deadline is today
 * @param {string|Date} deadline - Task deadline
 * @returns {boolean}
 */
export function isToday(deadline) {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  return deadlineDate.toDateString() === today.toDateString();
}

/**
 * Get time remaining until deadline
 * @param {string|Date} deadline - Task deadline
 * @returns {object} - { overdue, hours, minutes, text }
 */
export function getTimeRemaining(deadline) {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diff = deadlineDate - now;

  if (diff <= 0) {
    return { overdue: true, hours: 0, minutes: 0, text: "Overdue" };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let text;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    text = `${days} day${days > 1 ? 's' : ''} left`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m left`;
  } else {
    text = `${minutes}m left`;
  }

  return { overdue: false, hours, minutes, text };
}

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get start of today (midnight)
 * @returns {Date}
 */
export function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get end of today (23:59:59.999)
 * @returns {Date}
 */
export function getEndOfToday() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}
