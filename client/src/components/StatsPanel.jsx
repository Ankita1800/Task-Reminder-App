import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";

export default function StatsPanel() {
  const { disciplineScore, streak } = useContext(TaskContext);

  return (
    <div className="stats">
      <h2>Completion Score: {disciplineScore}%</h2>
      <h3>Streak: {streak}</h3>
    </div>
  );
}
