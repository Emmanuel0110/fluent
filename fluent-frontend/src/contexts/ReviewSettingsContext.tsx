import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { updateRemoteUserSettings } from "../APICalls";

interface ReviewSettings {
  reviewMode: "auto" | "manual";
  autoReviewDelay: number;
  theme: "light" | "dark";
}

interface ReviewSettingsContextType {
  settings: ReviewSettings;
  updateSettings: (newSettings: Partial<ReviewSettings>) => void;
  getReviewDelay: () => number;
  shouldShowAnswerAutomatically: () => boolean;
}

const defaultSettings: ReviewSettings = {
  reviewMode: "manual",
  autoReviewDelay: 10,
  theme: "light",
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
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReviewSettings>(defaultSettings);

  useEffect(() => {
    if (user?.userSettings) {
      setSettings({
        reviewMode: user.userSettings.reviewMode,
        autoReviewDelay: user.userSettings.autoReviewDelay,
        theme: user.userSettings.theme ?? "light",
      });
    }
  }, [user]);

  // Keep DOM and localStorage cache in sync whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
    localStorage.setItem("theme", settings.theme);
  }, [settings.theme]);

  const updateSettings = async (newSettings: Partial<ReviewSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      await updateRemoteUserSettings(updatedSettings);
    } catch (error) {
      console.error("Failed to update user settings:", error);
      setSettings(settings);
    }
  };

  const getReviewDelay = () => {
    return settings.reviewMode === "auto" ? settings.autoReviewDelay * 1000 : 0;
  };

  const shouldShowAnswerAutomatically = () => {
    return settings.reviewMode === "auto";
  };

  const value: ReviewSettingsContextType = {
    settings,
    updateSettings,
    getReviewDelay,
    shouldShowAnswerAutomatically,
  };

  return <ReviewSettingsContext.Provider value={value}>{children}</ReviewSettingsContext.Provider>;
};
