import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_PREFIX = "tutorialSeen:";

function hasSeen(tutorialId: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + tutorialId) === "true";
  } catch {
    return false;
  }
}

function markSeen(tutorialId: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + tutorialId, "true");
  } catch (e) {
    console.error("Failed to persist tutorial state:", e);
  }
}

/**
 * A one-time onboarding overlay. Shows `message` the first time it is rendered
 * with `active` true; once dismissed (or already seen) it never shows again,
 * keyed by `tutorialId` in localStorage. When `message` is an array, the steps
 * are shown one at a time, each advanced with a "next" button until the last,
 * which dismisses the overlay.
 */
export function TutorialOverlay({
  tutorialId,
  message,
  active,
}: {
  tutorialId: string;
  message: string | string[];
  active: boolean;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (active && !hasSeen(tutorialId)) {
      setVisible(true);
    }
  }, [active, tutorialId]);

  if (!visible) return null;

  const steps = Array.isArray(message) ? message : [message];
  const isLastStep = step >= steps.length - 1;

  const handleAdvance = () => {
    if (isLastStep) {
      markSeen(tutorialId);
      setVisible(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="blockerDarkBackground" onClick={handleAdvance}>
      <div id="above" onClick={(e) => e.stopPropagation()}>
        <p>{steps[step]}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <button className="btn btn-primary" onClick={handleAdvance}>
            {isLastStep ? t("tutorial.understood") : t("tutorial.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
