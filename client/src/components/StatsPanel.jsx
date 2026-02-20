import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import { useHistory } from "../context/HistoryContext";

export default function StatsPanel() {
  const { disciplineScore, streak, pendingCount, overdueCount } = useContext(TaskContext);
  const { getRecoveryDebt, getTodayStats, getOverallCompletionRate } = useHistory();
  
  const recoveryDebt = getRecoveryDebt();
  const todayStats = getTodayStats();
  const overallRate = getOverallCompletionRate();

  return (
    <div className="stats">
      <h2>Completion Score: {disciplineScore}%</h2>
      <h3>🔥 Streak: {streak}</h3>
      
      <div className="stats-details">
        <p>📋 Pending: {pendingCount}</p>
        <p>⚠️ Overdue: {overdueCount}</p>
        <p>✅ Today: {todayStats.completed} completed</p>
        <p>📊 Overall: {overallRate}%</p>
        
        {recoveryDebt > 0 && (
          <p className="recovery-debt">
            💪 Recovery Debt: {recoveryDebt} tasks from yesterday
          </p>
        )}
      </div>
    </div>
  );
}
