import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import StatsPanel from "../components/StatsPanel";
import AnalyticsChart from "../components/AnalyticsChart";

export default function Dashboard() {
  return (
    <div className="container">
      <h1>Task Reminder App</h1>
      <StatsPanel />
      <AnalyticsChart />
      <TaskForm />
      <TaskList />
    </div>
  );
}
