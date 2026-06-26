import React, { useState, useEffect, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Home.css";

import conversationDetail from "./slides/conversation-detail.png";
import wordUsage from "./slides/word-usage.png";
import wordSearch from "./slides/word-search.png";
import conversationReview from "./slides/conversation-review.png";
import dashbord from "./slides/dashboard.png";

const SLIDES = [
  { id: 1, src: conversationReview, alt: "Conversation review" },
  { id: 2, src: conversationDetail, alt: "Conversation detail" },
  { id: 3, src: wordSearch, alt: "Word search" },
  { id: 4, src: wordUsage, alt: "Word usage" },
  { id: 5, src: dashbord, alt: "Dashboard" },
];

const SLIDE_INTERVAL = 3000;
const SWIPE_THRESHOLD = 50;

const FEATURES = [
  {
    icon: "🧠",
    title: "Optimized cognitive load",
    text: "Bite-sized reviews keep your mind fresh, never overloaded.",
  },
  {
    icon: "🔁",
    title: "Reviews at the right time",
    text: "Spaced repetition surfaces each word exactly when you need it.",
  },
  {
    icon: "💬",
    title: "Words learned in context",
    text: "See vocabulary inside real sentences, not endless lists.",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      setCurrent((prev) => (delta < 0 ? (prev + 1) % SLIDES.length : (prev - 1 + SLIDES.length) % SLIDES.length));
    }
    touchStartX.current = null;
  };

  if (isAuthenticated === true) return <Navigate to="/review" replace />;
  if (isAuthenticated === null) return null;

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1 className="home-title">Fluent</h1>

        <div className="home-slideshow">
          <div className="home-slide-window" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div
              className="home-slides-track"
              style={{
                transform: `translateX(-${current * (100 / SLIDES.length)}%)`,
                width: `${SLIDES.length * 100}%`,
              }}
            >
              {SLIDES.map((slide) => (
                <div key={slide.id} className="home-slide">
                  <img src={slide.src} alt={slide.alt} className="home-slide-img" />
                </div>
              ))}
            </div>
          </div>
          <div className="home-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`home-dot${i === current ? " home-dot--active" : ""}`}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <p className="home-tagline">The free, opensource app to learn a language!</p>

        <div className="home-actions">
          <Link to="/get-started" className="home-btn-primary">
            GET STARTED
          </Link>
          <Link to="/login" className="home-btn-secondary">
            I ALREADY HAVE AN ACCOUNT
          </Link>
        </div>
      </div>

      <section className="home-features" aria-label="Why Fluent">
        <h2 className="home-features-title">Designed for your brain</h2>
        <ul className="home-features-list">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="home-feature">
              <span className="home-feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <span className="home-feature-copy">
                <span className="home-feature-name">{feature.title}</span>
                <span className="home-feature-text">{feature.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
