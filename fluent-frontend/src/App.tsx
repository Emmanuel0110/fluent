import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import { useTheme } from "./hooks/useTheme";
import Register from "./auth/components/Register";
import ForgotPassword from "./auth/components/ForgotPassword";
import ResetPassword from "./auth/components/ResetPassword";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "./Profile";
import Login from "./auth/components/Login";
import WordListWithDetail from "./components/WordListWithDetail";
import ConversationList from "./components/ConversationList";
import ConversationListWithDetail from "./components/ConversationListWithDetail";
import CreationForm from "./components/CreationForm";
import ConversationForm from "./components/ConversationForm";
import WordForm from "./components/WordForm";
import Review from "./components/Review";
import Dashboard from "./components/Dashboard";
import { ConfigProvider } from "./contexts/ConfigContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { DataProvider } from "./contexts/DataContext";
import { ReviewSettingsProvider } from "./contexts/ReviewSettingsContext";
import SuggestionList from "./components/SuggestionList";
import AdminRoute from "./AdminRoute";
import AdminFeedbacks from "./components/AdminFeedbacks";

export const url = import.meta.env.VITE_API_URL;

export default function App() {
  useTheme();
  return (
    <AuthProvider>
      <Routes>
        <Route path="register/*" element={<Register />} />
        <Route path="login/*" element={<Login />} />
        <Route path="forgot-password/*" element={<ForgotPassword />} />
        <Route path="reset-password/*" element={<ResetPassword />} />
        <Route
          element={
            <LanguageProvider>
              <ProtectedRoute redirectPath="login" />
            </LanguageProvider>
          }
        >
          <Route
            element={
              <DataProvider>
                <ConfigProvider>
                  <ReviewSettingsProvider>
                    <Layout />
                  </ReviewSettingsProvider>
                </ConfigProvider>
              </DataProvider>
            }
          >
            {/*TODO: remove if unused ? */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="words" element={<WordListWithDetail />} />
            <Route path="words/:wordId" element={<WordListWithDetail />} />
            <Route path="suggestions" element={<SuggestionList />} />
            <Route path="conversations" element={<ConversationList />} />
            <Route path="conversations/:conversationId" element={<ConversationListWithDetail />} />
            <Route element={<AdminRoute redirectPath="suggestions" />}>
              <Route path="new" element={<CreationForm />} />
              <Route
                path="words/:wordId/edit"
                element={
                  <div style={{ height: "100%", overflow: "auto", padding: "1rem" }}>
                    <WordForm />
                  </div>
                }
              />
              <Route
                path="conversations/:conversationId/edit"
                element={
                  //Move styling in the component
                  <div style={{ height: "100%", overflow: "auto", padding: "1rem" }}>
                    <ConversationForm />
                  </div>
                }
              />
              <Route path="admin/feedbacks" element={<AdminFeedbacks />} />
            </Route>
            <Route path="review" element={<Review />} />
            <Route path="profile" element={<Profile />} />
            <Route path="/" element={<Login />} />
          </Route>
        </Route>
        <Route path="*" element={<p>There's nothing here: 404!</p>} />
      </Routes>
    </AuthProvider>
  );
}
