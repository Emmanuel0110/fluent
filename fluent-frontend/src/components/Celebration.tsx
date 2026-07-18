import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { useTranslation } from "react-i18next";
import { CelebrationEvent } from "../types";
import { RankBadge } from "./RankBadge";
import "./Celebration.css";

// How long the toast stays on screen before auto-dismissing (ms).
const DURATION = 3200;
const COLORS = ["#ffd700", "#ff7a59", "#5e9bff", "#7be08a", "#c77dff"];

function fireConfetti() {
  // A central burst plus a short stream from both edges for a livelier effect.
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: COLORS });
  const end = Date.now() + 1000;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: COLORS });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export default function Celebration({ event, onDone }: { event: CelebrationEvent; onDone: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    fireConfetti();
    const timer = setTimeout(onDone, DURATION);
    return () => clearTimeout(timer);
  }, [event, onDone]);

  // Rank celebrations carry a rank key (e.g. "Advanced") that must itself be translated.
  const message =
    event.type === "rank"
      ? t("celebration.rank", { value: t(`dashboard.rank.${event.value}`) })
      : t(`celebration.${event.type}`, { value: event.value });

  return (
    <div className="celebration-overlay">
      <div className="celebration-toast" key={`${event.type}-${event.value}`} onClick={onDone}>
        {event.type === "rank" ? (
          // Show the badge just earned rather than a generic trophy emoji.
          <div className="celebration-icon celebration-badge">
            <RankBadge rank={String(event.value)} />
          </div>
        ) : (
          <div className="celebration-icon">{event.type === "streak" ? "🔥" : "🎉"}</div>
        )}
        <div className="celebration-message">{message}</div>
      </div>
    </div>
  );
}
