import { createContext, useState, useEffect } from "react";

export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem("streak");
    return saved ? JSON.parse(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("streak", JSON.stringify(streak));
  }, [streak]);

  const addTask = (task) => {
    setTasks([...tasks, { ...task, id: Date.now(), completed: false }]);
  };

  const completeTask = (id) => {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, completed: true } : t
    );
    setTasks(updated);
    setStreak(streak + 1);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const disciplineScore = tasks.length === 0
    ? 100
    : Math.round(
        (tasks.filter(t => t.completed).length / tasks.length) * 100
      );

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        completeTask,
        deleteTask,
        disciplineScore,
        streak
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
