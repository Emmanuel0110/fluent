import React from "react";
import { Link } from "react-router-dom";
import "./PrivacyPolicy.css";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-container">
      <div className="privacy-content">
        <Link to="/" className="privacy-back">← Fluent</Link>

        <h1>Privacy Policy</h1>
        <p className="privacy-date">Last updated: June 2025</p>

        <section>
          <h2>1. Who we are</h2>
          <p>
            Fluent (<strong>fluent.study</strong>) is a language learning application. Questions about
            this policy can be sent to <a href="mailto:emmanuel.paatz@googlemail.com">emmanuel.paatz@googlemail.com</a>.
          </p>
        </section>

        <section>
          <h2>2. Data we collect</h2>
          <ul>
            <li><strong>Account data</strong>: username, email address, hashed password (or OAuth provider identifier for Google sign-in).</li>
            <li><strong>Learning data</strong>: words, conversations, review scores, and progress history tied to your account.</li>
            <li><strong>Feedback</strong>: comments you voluntarily submit via the feedback form, along with the page URL at time of submission.</li>
            <li><strong>Usage data</strong>: last login date, review settings.</li>
          </ul>
          <p>We do not collect payment information, precise location, or any data from minors under 16.</p>
        </section>

        <section>
          <h2>3. How we use your data</h2>
          <ul>
            <li>To authenticate you and display your personalised learning content.</li>
            <li>To calculate and display your learning progress.</li>
            <li>To send transactional emails (password reset only).</li>
            <li>To improve the application based on aggregated, anonymised feedback.</li>
          </ul>
          <p>We do not sell your data, use it for advertising, or share it with third parties except as required to operate the service (hosting infrastructure).</p>
        </section>

        <section>
          <h2>4. Legal basis (GDPR)</h2>
          <p>
            Processing is based on the performance of a contract (Art. 6(1)(b) GDPR) — your data is
            necessary to provide the service — and on your consent where explicitly requested.
          </p>
        </section>

        <section>
          <h2>5. Data retention</h2>
          <ul>
            <li>Account and learning data are kept as long as your account is active.</li>
            <li>Accounts inactive for more than <strong>2 years</strong> are automatically deleted along with all associated data.</li>
            <li>Feedback entries are deleted after <strong>2 years</strong>.</li>
            <li>You can delete your account at any time from your profile settings, which immediately removes all your data.</li>
          </ul>
        </section>

        <section>
          <h2>6. Your rights</h2>
          <p>Under the GDPR you have the right to:</p>
          <ul>
            <li><strong>Access</strong> — export all your data from your profile settings.</li>
            <li><strong>Rectification</strong> — update your email address in your profile settings.</li>
            <li><strong>Erasure</strong> — delete your account and all associated data from your profile settings.</li>
            <li><strong>Portability</strong> — your data export is provided in machine-readable JSON format.</li>
            <li><strong>Object or restrict processing</strong> — contact us at the address above.</li>
          </ul>
          <p>
            You also have the right to lodge a complaint with your national data protection authority.
          </p>
        </section>

        <section>
          <h2>7. Cookies and local storage</h2>
          <p>
            Fluent uses browser <strong>localStorage</strong> solely to store your authentication token.
            No tracking cookies or third-party analytics are used.
          </p>
        </section>

        <section>
          <h2>8. Changes to this policy</h2>
          <p>
            If we make material changes we will update the date at the top of this page. Continued use
            of Fluent after changes are posted constitutes acceptance.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
