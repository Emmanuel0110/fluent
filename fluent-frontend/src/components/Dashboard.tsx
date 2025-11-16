import React, { useEffect, useState } from "react";
import { getDashboardData } from "../APICalls";
import { DashboardData } from "../types";
import "./Dashboard.css";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getDashboardData();
      setDashboardData(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-error">
        <p>Failed to load dashboard data</p>
      </div>
    );
  }

  const { progress, rank, chartData } = dashboardData;
  const maxWords = Math.max(...chartData.map((d) => d.wordsLearned), 1);
  const minWords = Math.min(...chartData.map((d) => d.wordsLearned));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Progress</h1>
      </div>

      {/* Rank and Progress Section */}
      <div className="dashboard-section">
        <div className="rank-progress-container">
          {/* Rank on the left */}
          <div className="rank-display">
            {rank && (
              <div className="rank-icon">
                <div className={`rank-${rank}`} />
              </div>
            )}
            <span className="rank-label">{rank}</span>
          </div>
          {/* Progress bar on the right */}
          <div className="progress-display">
            <div className="progress-header">
              <span className="progress-value">{progress}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="dashboard-section chart-section">
        <h2>Words Learned Over Time</h2>
        <div className="chart-container">
          {chartData.map((data, index) => {
            const height = maxWords !== minWords ? ((data.wordsLearned - minWords) / (maxWords - minWords)) * 100 : 100;
            return (
              <div key={index} className="chart-bar-wrapper">
                <div className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{ height: `${height}%` }}
                    title={`${data.wordsLearned} words on ${data.date}`}
                  >
                    <div className="chart-bar-score">
                      <span>{data.wordsLearned}</span>
                    </div>
                    <div className="chart-bar-label">
                      <span>{data.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
