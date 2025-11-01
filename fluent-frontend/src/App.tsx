import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Register from "./auth/components/Register";
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

export const url = process.env.REACT_APP_API_URL;

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="register/*" element={<Register />} />
        <Route path="login/*" element={<Login />} />
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
            <Route path="home" element={<ConversationList />} />
            {/*TODO: remove if unused ? */}
            <Route path="new" element={<CreationForm />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="words" element={<WordListWithDetail />} />
            <Route path="words/:wordId" element={<WordListWithDetail />} />
            <Route path="words/:wordId/edit" element={<WordForm />} />
            <Route path="suggestions" element={<SuggestionList />} />
            <Route path="conversations/:conversationId" element={<ConversationListWithDetail />} />
            <Route path="conversations/:conversationId/edit" element={<ConversationForm />} />
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
