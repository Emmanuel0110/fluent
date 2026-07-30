import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./ReviewTimeSplash.css";

const DURATION = 1000;

// /review is the app's landing route, so it is also reached by the login and
// Home redirects. Module scope rather than component state so the splash greets
// the user once per page load and not again every time they come back to the
// review tab. Resets on reload / new tab / cold PWA launch.
let shown = false;

/**
 * A one-second, non-dismissible greeting shown on arrival at the review page.
 * Note the effect keys off `visible`, not off `shown`: under StrictMode the
 * mount effect runs twice, and guarding on `shown` would make the second pass
 * skip arming the timer — leaving a blocking overlay with no way out.
 */
export default function ReviewTimeSplash() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(!shown);

  useEffect(() => {
    if (!visible) return;
    shown = true;
    const timer = setTimeout(() => setVisible(false), DURATION);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="review-splash">
      <div className="review-splash-icon">⏰</div>
      <div className="review-splash-message">{t("review.splash")}</div>
    </div>
  );
}
