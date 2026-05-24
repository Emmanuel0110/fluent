import React, { useEffect, useState } from "react";
import { getDashboardData } from "../APICalls";
import { DashboardData } from "../types";
import "./Dashboard.css";
import { useTranslation } from "react-i18next";

function Dashboard() {
  const { t } = useTranslation();
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
        <p>{t("dashboard.loading")}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-error">
        <p>{t("dashboard.error")}</p>
      </div>
    );
  }

  const { progress, rank, chartData } = dashboardData;
  const maxWords = Math.max(...chartData.map((d) => d.wordsLearned), 1);
  const minWords = Math.min(...chartData.map((d) => d.wordsLearned));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{t("dashboard.title")}</h1>
      </div>

      <div className="dashboard-section">
        <div className="rank-progress-container">
          <div className="rank-display">
            {rank && (
              <div className="rank-icon">
                <div className={`rank-${rank}`} />
              </div>
            )}
            <span className="rank-label">{rank}</span>
          </div>
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

      <div className="dashboard-section chart-section">
        <h2>{t("dashboard.chart_title")}</h2>
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
