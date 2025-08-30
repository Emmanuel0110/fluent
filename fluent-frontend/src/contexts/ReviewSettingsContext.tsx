import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ReviewSettings {
  mode: "auto" | "manual";
  autoDelay: number;
}

interface ReviewSettingsContextType {
  settings: ReviewSettings;
  updateSettings: (newSettings: Partial<ReviewSettings>) => void;
  getReviewDelay: () => number;
  shouldShowAnswerAutomatically: () => boolean;
}

const defaultSettings: ReviewSettings = {
  mode: "manual",
  autoDelay: 10,
};

const ReviewSettingsContext = createContext<ReviewSettingsContextType | undefined>(undefined);

export const useReviewSettings = () => {
  const context = useContext(ReviewSettingsContext);
  if (!context) {
    throw new Error("useReviewSettings must be used within a ReviewSettingsProvider");
  }
  return context;
};

interface ReviewSettingsProviderProps {
  children: ReactNode;
}

export const ReviewSettingsProvider: React.FC<ReviewSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ReviewSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedMode = localStorage.getItem("reviewMode") as "auto" | "manual" | null;
    const savedDelay = localStorage.getItem("autoReviewDelay");

    if (savedMode || savedDelay) {
      setSettings({
        mode: savedMode || defaultSettings.mode,
        autoDelay: savedDelay ? parseInt(savedDelay) : defaultSettings.autoDelay,
      });
    }
  }, []);

  const updateSettings = (newSettings: Partial<ReviewSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    // Save to localStorage
    if (newSettings.mode !== undefined) {
      localStorage.setItem("reviewMode", newSettings.mode);
    }
    if (newSettings.autoDelay !== undefined) {
      localStorage.setItem("autoReviewDelay", newSettings.autoDelay.toString());
    }
  };

  const getReviewDelay = () => {
    return settings.mode === "auto" ? settings.autoDelay * 1000 : 0; // Convert to milliseconds
  };

  const shouldShowAnswerAutomatically = () => {
    return settings.mode === "auto";
  };

  const value: ReviewSettingsContextType = {
    settings,
    updateSettings,
    getReviewDelay,
    shouldShowAnswerAutomatically,
  };

  return <ReviewSettingsContext.Provider value={value}>{children}</ReviewSettingsContext.Provider>;
};
