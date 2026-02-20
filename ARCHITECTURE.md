# Task Reminder App - System Architecture

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Data Flow](#data-flow)
4. [Notification System](#notification-system)
5. [Auto-Check Logic](#auto-check-logic)
6. [History Tracking](#history-tracking)
7. [Recovery Logic](#recovery-logic)
8. [State Management](#state-management)
9. [Scalability Path](#scalability-path)
10. [Interview Explanations](#interview-explanations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    React Application                     │    │
│  │  ┌─────────────────────────────────────────────────────┐│    │
│  │  │              Context Layer (State)                  ││    │
│  │  │  ┌─────────────────┐  ┌─────────────────────────┐  ││    │
│  │  │  │  TaskContext    │  │    HistoryContext       │  ││    │
│  │  │  │  - tasks[]      │  │    - dailyHistory{}     │  ││    │
│  │  │  │  - streak       │  │    - recoveryDebt       │  ││    │
│  │  │  │  - CRUD actions │  │    - completion rates   │  ││    │
│  │  │  └────────┬────────┘  └────────────┬────────────┘  ││    │
│  │  └───────────┼────────────────────────┼───────────────┘│    │
│  │              │                        │                 │    │
│  │  ┌───────────▼────────────────────────▼───────────────┐│    │
│  │  │                 Components Layer                    ││    │
│  │  │  Dashboard → TaskForm, TaskList, StatsPanel, Chart ││    │
│  │  └─────────────────────────┬───────────────────────────┘│    │
│  │                            │                             │    │
│  │  ┌─────────────────────────▼───────────────────────────┐│    │
│  │  │                   Hooks Layer                        ││    │
│  │  │  useAutoCheck (interval-based deadline monitoring)   ││    │
│  │  └─────────────────────────┬───────────────────────────┘│    │
│  │                            │                             │    │
│  │  ┌─────────────────────────▼───────────────────────────┐│    │
│  │  │                  Utils Layer                         ││    │
│  │  │  notification.js │ dateUtils.js                      ││    │
│  │  └─────────────────────────┬───────────────────────────┘│    │
│  └────────────────────────────┼─────────────────────────────┘    │
│                               │                                   │
├───────────────────────────────▼───────────────────────────────────┤
│                        Browser APIs                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ localStorage │  │ Notification │  │ setInterval/Date     │    │
│  │ (persistence)│  │ (alerts)     │  │ (time operations)    │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
client/src/
├── main.jsx          # Entry point
├── App.jsx           # Root component with providers
│
├── context/          # Global state management
│   ├── TaskContext.jsx      # Task CRUD and state
│   └── HistoryContext.jsx   # Daily performance tracking
│
├── components/       # Reusable UI components
│   ├── TaskForm.jsx         # Add new tasks
│   ├── TaskList.jsx         # Display and manage tasks
│   ├── StatsPanel.jsx       # Show scores and streak
│   ├── AnalyticsChart.jsx   # Visual performance chart
│   └── AIEngine.js          # AI-powered warnings
│
├── pages/            # Route-level components
│   └── Dashboard.jsx        # Main app page
│
├── hooks/            # Custom React hooks
│   └── useAutoCheck.js      # Deadline monitoring
│
├── utils/            # Pure utility functions
│   ├── notification.js      # Browser Notification API
│   └── dateUtils.js         # Date manipulation
│
└── styles/           # CSS files
    └── styles.css
```

### Why This Structure?

| Folder | Purpose | Benefit |
|--------|---------|---------|
| `context/` | Global state | Avoids prop drilling, centralized logic |
| `components/` | UI building blocks | Reusable, testable, focused |
| `pages/` | Route containers | Clear navigation structure |
| `hooks/` | Stateful logic | Shareable behavior across components |
| `utils/` | Pure functions | No side effects, easy to test |
| `styles/` | CSS | Separation of concerns |

---

## Data Flow

```
User Action                  State Change                Side Effects
    │                            │                           │
    ▼                            ▼                           ▼
┌─────────┐    dispatch    ┌─────────────┐    trigger   ┌──────────┐
│ TaskForm│ ──────────────►│ TaskContext │ ────────────►│ localStorage│
│ (input) │   addTask()    │ (state)     │              │ (persist)   │
└─────────┘                └──────┬──────┘              └────────────┘
                                  │
                                  ▼ re-render
                           ┌─────────────┐
                           │  TaskList   │
                           │ (display)   │
                           └─────────────┘
```

### Event-Driven Architecture

1. **User events** → Component handlers → Context actions
2. **Time events** → useAutoCheck hook → Notifications
3. **State changes** → useEffect → localStorage sync

---

## Notification System

### Browser Notification API Flow

```
┌──────────────────┐
│ Request Permission│
└────────┬─────────┘
         │
         ▼
    ┌─────────┐
    │ Granted?│
    └────┬────┘
         │
    ┌────┴────┐
    │ Yes     │ No
    ▼         ▼
┌────────┐ ┌────────┐
│ Show   │ │ Silent │
│ Notif  │ │ Mode   │
└────────┘ └────────┘
```

### Why Separate `utils/notification.js`?

1. **Platform Abstraction**: Browser API details hidden from components
2. **Single Responsibility**: One file, one concern
3. **Testability**: Pure functions, easy mocking
4. **Future-Proofing**: Easy switch to push notifications

### Limitations

| Scenario | Behavior |
|----------|----------|
| Tab Open | ✅ Notifications work |
| Tab Background | ⚠️ Browser may throttle |
| Tab Closed | ❌ No notifications |
| PWA Installed | ✅ Better background support |
| Service Worker | ✅ True push notifications |

---

## Auto-Check Logic

### Why 60000ms (1 Minute) Interval?

```
Interval Options:
─────────────────────────────────────────────────
1 second  │████████████████████████│ Too aggressive
1 minute  │████████░░░░░░░░░░░░░░░░│ Balanced ✓
5 minutes │██░░░░░░░░░░░░░░░░░░░░░░│ Too slow
─────────────────────────────────────────────────
          High CPU                    Low Response
```

### Performance Considerations

```javascript
// O(n) where n = number of tasks
tasks.forEach(task => {
  if (isOverdue(task.deadline)) {
    // O(1) operations
  }
});

// Acceptable for: < 1000 tasks
// For larger scale: Web Worker or server-side
```

### Cleanup Pattern

```javascript
useEffect(() => {
  const id = setInterval(check, 60000);  // Setup
  return () => clearInterval(id);         // Cleanup
}, []);

// Timeline:
// Mount → Start interval → ... → Unmount → Clear interval
//                          ↑
//                    Cleanup runs here
```

---

## History Tracking

### Data Structure

```javascript
{
  "2026-02-20": { completed: 5, missed: 2 },
  "2026-02-19": { completed: 3, missed: 1 },
  "2026-02-18": { completed: 7, missed: 0 }
}
```

### Why ISO Date Keys (YYYY-MM-DD)?

1. **Sortable**: `"2026-02-19" < "2026-02-20"` works correctly
2. **Unambiguous**: No timezone confusion
3. **Universal**: Recognized worldwide
4. **Parseable**: `new Date("2026-02-20")` works

### Why localStorage vs Database?

| Aspect | localStorage | Database |
|--------|-------------|----------|
| Cost | Free | Server costs |
| Offline | ✅ Works | ❌ Requires internet |
| Latency | ~1ms | ~100ms+ |
| Multi-device | ❌ Single device | ✅ Synced |
| Privacy | ✅ Local only | ⚠️ Server has data |
| Limit | ~5MB | Unlimited |

**MVP Choice**: localStorage (fast iteration, zero cost)
**Production**: Migrate to MongoDB when multi-device needed

---

## Recovery Logic

### Concept

```
Yesterday: Missed 3 tasks
Today: Must complete 3 EXTRA tasks to "recover"

Normal Day: 5 tasks → complete 5
Recovery Day: 5 tasks + 3 debt → complete 8
```

### Why Recovery Debt?

1. **Accountability**: Can't ignore failures
2. **Behavioral Psychology**: Consequence creates awareness
3. **Gamification**: Challenge to overcome debt
4. **Data-Driven**: Historical pattern tracking

### Safe Yesterday Calculation

```javascript
function getYesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);  // Handles month/year boundaries
  return yesterday.toISOString().split('T')[0];
}

// Examples:
// Today: 2026-03-01 → Yesterday: 2026-02-28 ✓
// Today: 2026-01-01 → Yesterday: 2025-12-31 ✓
```

### Optional Chaining Explained

```javascript
// Without optional chaining:
if (history[key] && history[key].missed) {
  return history[key].missed;
}

// With optional chaining:
return history[key]?.missed || 0;

// Why?
// - If history[key] is undefined, returns undefined (not error)
// - || 0 provides a fallback
// - Cleaner, more readable
```

---

## State Management

### Why React Context?

```
React Context                    Redux
─────────────                    ─────
✓ Built-in                       ✗ Extra dependency
✓ Simple API                     ✗ Boilerplate (actions, reducers)
✓ Sufficient for small apps      ✓ Scales to complex apps
✓ Easy to learn                  ✗ Steeper learning curve
✗ No middleware                  ✓ Middleware support
✗ No dev tools                   ✓ Time-travel debugging
```

### When to Choose What

| Criteria | Context | Redux | Zustand |
|----------|---------|-------|---------|
| State slices | < 5 | > 5 | Any |
| Team size | Small | Large | Any |
| Need middleware | No | Yes | Optional |
| Bundle size matters | Yes | No | Yes |

### Context Interaction

```
HistoryProvider
  │
  └── TaskProvider
        │
        ├── useHistory() → Record completions/misses
        └── useTaskContext() → CRUD tasks

// Task completion flow:
completeTask(id)
  → Update task state
  → recordCompletion() (history)
  → Show notification
  → Persist to localStorage
```

---

## Scalability Path

### Current (MVP)

```
Browser
  │
  └── React App
        │
        ├── localStorage (tasks, history)
        └── Notification API
```

### Production Scale

```
Browser                          Server
  │                                │
  └── React App ◄──── API ────► Express
        │                          │
        ├── Service Worker         ├── MongoDB
        └── Push Subscription      ├── Redis (cache)
                                   └── Push Server
```

### Migration Steps

1. **Add Express Backend**
   - `/api/tasks` - CRUD endpoints
   - `/api/history` - Analytics endpoints
   - JWT authentication

2. **Replace localStorage**
   ```javascript
   // Before
   localStorage.setItem('tasks', JSON.stringify(tasks))
   
   // After
   await fetch('/api/tasks', { method: 'POST', body: JSON.stringify(task) })
   ```

3. **Add Service Worker**
   - Cache app shell for offline
   - Handle push notifications
   - Background sync

4. **Database Schema (MongoDB)**
   ```javascript
   // Task Collection
   {
     _id: ObjectId,
     userId: ObjectId,
     title: String,
     deadline: Date,
     completed: Boolean,
     createdAt: Date
   }
   
   // History Collection
   {
     _id: ObjectId,
     userId: ObjectId,
     date: String,      // "2026-02-20"
     completed: Number,
     missed: Number
   }
   ```

---

## Interview Explanations

### "Tell me about your project"

> "I built a Task Reminder App that goes beyond typical CRUD functionality. It features **time-based logic** with automatic deadline monitoring, a **notification system** using the Browser Notification API, and a **behavioral tracking system** that calculates recovery debt based on yesterday's missed tasks.
>
> The architecture uses **React Context** for state management, which I chose over Redux due to the app's moderate complexity. I implemented **clean separation of concerns**: utils for pure functions, hooks for stateful logic, contexts for global state, and components for UI.
>
> What makes this interesting is the **event-driven time monitoring** - a custom hook runs checks every minute, comparing timestamps and triggering notifications for overdue tasks. The history system uses **ISO-formatted date keys** for reliable sorting and comparison."

### "Why is this more than a CRUD app?"

> "While it has CRUD operations, the **time dimension** adds significant complexity:
>
> 1. **Deadline Monitoring**: setInterval-based checks compare Date objects
> 2. **Notification Orchestration**: Browser API permission handling, deduplication via task IDs
> 3. **Historical Analytics**: Daily aggregation with localStorage persistence
> 4. **Recovery Logic**: Behavioral debt calculation from previous day
> 5. **State Synchronization**: Multiple contexts interacting (tasks → history)
>
> A pure CRUD app is stateless between sessions. This app maintains **temporal state** - it knows what happened yesterday and affects today's behavior."

### "Explain the time-based complexity"

> "Time introduces **asynchronous state changes** independent of user input:
>
> 1. **Polling vs Push**: I chose 60-second intervals as a balance between responsiveness and CPU usage
> 2. **Race Conditions**: Task could be completed while being checked - I use Set() to track notified IDs
> 3. **Timezone Handling**: ISO date keys avoid ambiguity
> 4. **Cleanup**: useEffect cleanup prevents memory leaks from orphaned intervals
> 5. **Edge Cases**: Month/year boundaries in date calculations
>
> This is similar to problems in real-time systems - message queues, heartbeats, session timeouts."

### "How would you scale this?"

> "The architecture is designed for evolution:
>
> 1. **Replace localStorage with API calls**: The context layer abstracts storage - changing `localStorage.setItem` to `fetch()` is localized
>
> 2. **Add Service Worker**: For true push notifications when the app is closed
>
> 3. **Database migration**: MongoDB for persistence, Redis for session/cache
>
> 4. **Horizontal scaling**: The interval-based checking could move to a server-side cron job for consistency across devices
>
> The key insight is **separation of concerns** - notification logic in utils, state in contexts, persistence abstracted. Each layer can be upgraded independently."

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Management | Context | Simplicity over Redux boilerplate |
| Persistence | localStorage | Zero cost MVP, offline support |
| Check Interval | 60 seconds | Balance: responsiveness vs CPU |
| Date Format | ISO 8601 | Sortable, unambiguous, universal |
| Notifications | Browser API | No server needed, immediate feedback |
| Project Structure | Layered | Separation of concerns, testability |
| Custom Hooks | useAutoCheck | Encapsulated, reusable logic |

---

*This document serves as both technical documentation and interview preparation material.*
