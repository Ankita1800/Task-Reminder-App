import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

export default function AnalyticsChart() {
  const { tasks } = useContext(TaskContext);

  const data = tasks.map(task => ({
    name: new Date(task.deadline).toLocaleDateString(),
    completed: task.completed ? 1 : 0
  }));

  if (tasks.length === 0) {
    return (
      <div className="analytics-empty">
        <p>Add tasks to see your task analytics</p>
      </div>
    );
  }

  return (
    <div className="analytics-chart">
      <h2>Performance Analytics</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="name" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip 
            contentStyle={{ background: '#222', border: 'none' }}
            labelStyle={{ color: '#fff' }}
          />
          <Line 
            type="monotone" 
            dataKey="completed" 
            stroke="#82ca9d" 
            strokeWidth={2}
            dot={{ fill: '#82ca9d' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
