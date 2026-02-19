export function checkOverdue(task) {
  const now = new Date();
  const deadline = new Date(task.deadline);
  return !task.completed && deadline < now;
}

export async function generateWarning(task) {
  try {
    const response = await fetch("http://localhost:5000/ai-warning", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ taskTitle: task.title })
    });

    const data = await response.json();
    return data.message;
  } catch (error) {
    // Fallback messages if API fails
    const messages = [
      `You missed "${task.title}". Discipline is built through action.`,
      `Late again? "${task.title}" deserved priority.`,
      `No excuses. "${task.title}" was scheduled for a reason.`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}
