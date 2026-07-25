import React, { useEffect, useState } from "react";
import { getDashboardData } from "../APICalls";
import { DashboardData } from "../types";
import "./Dashboard.css";
import { TutorialOverlay } from "./TutorialOverlay";
import { RankBadge } from "./RankBadge";
import { useTranslation } from "react-i18next";

interface DashboardProps {
  // Custom loader — used to render another group member's dashboard (whose payload
  // also carries `username`). Defaults to the authenticated user's own dashboard.
  fetcher?: () => Promise<(DashboardData & { username?: string }) | null>;
  // The dashboard tutorial only makes sense on the learner's own dashboard.
  showTutorial?: boolean;
}

function Dashboard({ fetcher, showTutorial = true }: DashboardProps = {}) {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<(DashboardData & { username?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await (fetcher ? fetcher() : getDashboardData());
      setDashboardData(data);
      setLoading(false);
    };
    fetchData();
  }, [fetcher]);

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

  const { progress, rank, chartData, currentStreak, longestStreak } = dashboardData;
  // Days with no recorded data (wordsLearned === null) are excluded from the
  // min/max range so they don't skew bar heights, and render as a "no data" gap.
  const recordedValues = chartData
    .map((d) => d.wordsLearned)
    .filter((v): v is number => v !== null);
  const maxWords = Math.max(...recordedValues, 1);
  const minWords = recordedValues.length ? Math.min(...recordedValues) : 0;

  return (
    <div className="dashboard-container">
      {showTutorial && (
        <TutorialOverlay tutorialId="dashboard" message={t("tutorial.dashboard")} active={true} />
      )}
      <div className="dashboard-header">
        <h1>{dashboardData.username ?? t("dashboard.title")}</h1>
      </div>

      <div className="dashboard-section">
        <div className="rank-progress-container">
          <div className="rank-display">
            {rank && (
              <div className="rank-icon">
                <RankBadge rank={rank} />
              </div>
            )}
            <span className="rank-label">{rank ? t(`dashboard.rank.${rank}`) : ""}</span>
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
            const noData = data.wordsLearned === null;
            const height = noData
              ? 100
              : maxWords !== minWords
                ? ((data.wordsLearned! - minWords) / (maxWords - minWords)) * 100
                : 100;
            return (
              <div key={index} className="chart-bar-wrapper">
                <div className="chart-bar-container">
                  <div
                    className={`chart-bar${noData ? " chart-bar--no-data" : ""}`}
                    style={{ height: `${height}%` }}
                    title={noData ? `${t("dashboard.no_data")} (${data.date})` : `${data.wordsLearned} words on ${data.date}`}
                  >
                    <div className="chart-bar-score">
                      <span>{noData ? "–" : data.wordsLearned}</span>
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

      <div className="dashboard-section streak-section">
        <h2>{t("dashboard.streak_title")}</h2>
        <div className="streak-display">
          <span className={`streak-flame${currentStreak > 0 ? " active" : ""}`}>🔥</span>
          <span className="streak-count">{currentStreak}</span>
          <span className="streak-unit">{t("dashboard.streak_unit")}</span>
        </div>
        {longestStreak > 0 && (
          <p className="streak-best">
            {t("dashboard.streak_best")}: {longestStreak} {t("dashboard.streak_unit")}
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
