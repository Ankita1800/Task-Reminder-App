import { useContext, useState, useEffect } from "react";
import { TaskContext } from "../context/TaskContext";
import { checkOverdue, generateWarning } from "./AIEngine";

function TaskCard({ task, completeTask, deleteTask }) {
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const overdue = checkOverdue(task);

  useEffect(() => {
    if (overdue && !warning) {
      setLoading(true);
      generateWarning(task).then((msg) => {
        setWarning(msg);
        setLoading(false);
      });
    }
  }, [overdue, task, warning]);

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>Deadline: {new Date(task.deadline).toLocaleString()}</p>

      {overdue && (
        <p className="warning">
          {loading ? "Loading AI response..." : warning}
        </p>
      )}

      {!task.completed && (
        <button onClick={() => completeTask(task.id)}>
          Complete
        </button>
      )}

      <button onClick={() => deleteTask(task.id)}>
        Delete
      </button>
    </div>
  );
}

export default function TaskList() {
  const { tasks, completeTask, deleteTask } = useContext(TaskContext);

  return (
    <div className="task-list">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          completeTask={completeTask}
          deleteTask={deleteTask}
        />
      ))}
    </div>
  );
}
