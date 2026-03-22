import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildLocalizedPath } from '../../utils/localeRouting';

export function PrivacyEn() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="last-updated">Last Updated: December 16, 2025</p>

      <section>
        <h2>1. Data Controller</h2>
        <p>
          The data controller responsible for your personal data under the General Data Protection
          Regulation (GDPR) is:
        </p>
        <div className="data-controller-info">
          <p><strong>Service:</strong> World Quiz</p>
          <p><strong>Controller:</strong> World Quiz Team</p>
          <p><strong>Contact Email:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></p>
          <p><strong>Jurisdiction:</strong> Czech Republic, European Union</p>
        </div>
        <p>
          This Privacy Policy explains how we collect, use, process, and protect your personal data
          in compliance with GDPR (Regulation EU 2016/679) and Czech Act No. 110/2019 Coll. on
          Personal Data Processing.
        </p>
      </section>

      <section>
        <h2>2. Legal Basis for Data Processing</h2>
        <p>
          We process your personal data based on the following legal grounds under Article 6(1) GDPR:
        </p>

        <h3>2.1 Contractual Necessity (Article 6(1)(b))</h3>
        <p>Processing is necessary to provide the Service you have requested:</p>
        <ul>
          <li><strong>User ID (Firebase UID):</strong> Required to identify your unique account and associate your game data</li>
          <li><strong>Username:</strong> Required to display your identity on leaderboards and within the game interface</li>
          <li><strong>Game Scores & Timestamps:</strong> Required to provide leaderboard functionality and track your progress</li>
        </ul>

        <h3>2.2 Legitimate Interest (Article 6(1)(f))</h3>
        <p>Processing is necessary for our legitimate interests in ensuring security and technical functionality:</p>
        <ul>
          <li><strong>Email Address:</strong> Used solely for account recovery and to ensure unique user identification.
          It is NOT used for marketing purposes.</li>
        </ul>

        <h3>2.3 Consent (Article 6(1)(a))</h3>
        <p>When you use Google Sign-In, you explicitly consent to:</p>
        <ul>
          <li>Sharing your Google User ID, email, and name with our Service via Google OAuth 2.0</li>
          <li>Transient display of your Google profile picture during active sessions (not permanently stored)</li>
        </ul>
      </section>

      <section>
        <h2>3. Data We Collect</h2>

        <h3>3.1 Account Authentication Data</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data Type</th>
              <th>Source</th>
              <th>Purpose</th>
              <th>Storage Location</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>User ID (UID)</td>
              <td>Firebase Authentication</td>
              <td>Unique account identification</td>
              <td>Firebase Auth, Firestore</td>
            </tr>
            <tr>
              <td>Email Address</td>
              <td>You / Google OAuth</td>
              <td>Account recovery, unique identification</td>
              <td>Firebase Authentication only</td>
            </tr>
            <tr>
              <td>Password (hashed)</td>
              <td>You (email/password signup)</td>
              <td>Secure authentication</td>
              <td>Firebase Authentication</td>
            </tr>
            <tr>
              <td>Username (Nickname)</td>
              <td>You</td>
              <td>Display on leaderboards</td>
              <td>Cloud Firestore</td>
            </tr>
          </tbody>
        </table>

        <h3>3.2 Session Data (Not Permanently Stored)</h3>
        <ul>
          <li><strong>Google Profile Picture:</strong> Transiently processed for display purposes during your active
          session. This image is never saved to persistent storage (not stored in Firestore or any database).</li>
        </ul>

        <h3>3.3 Game Data</h3>
        <ul>
          <li><strong>Scores:</strong> Daily best scores and all-time best scores for each game mode</li>
          <li><strong>Streaks:</strong> Current and maximum streak counts</li>
          <li><strong>Timestamps:</strong> Date and time when games are played</li>
          <li><strong>Play History:</strong> Historical record of your gameplay for statistical purposes</li>
        </ul>

        <h3>3.4 Technical Data</h3>
        <ul>
          <li><strong>Browser Local Storage:</strong> Session tokens, cached leaderboard data, user preferences</li>
          <li><strong>No Cookies:</strong> We do not use tracking cookies. Only essential session management via
          Firebase Authentication tokens.</li>
        </ul>
      </section>

      <section>
        <h2>4. Third-Party Data Processors</h2>
        <p>
          Under Article 28 GDPR, we use the following third-party processors who may access your data:
        </p>

        <h3>4.1 Google Ireland Limited</h3>
        <p><strong>Services Used:</strong></p>
        <ul>
          <li>Firebase Authentication - User login and credential management</li>
          <li>Cloud Firestore - Database storage for usernames and scores</li>
          <li>Firebase Hosting - Static file delivery</li>
        </ul>
        <p><strong>Data Transferred:</strong> User ID, Email, Username, Scores</p>
        <p><strong>Location:</strong> EU data centers (compliant with GDPR)</p>
        <p><strong>Privacy Policy:</strong> <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
          firebase.google.com/support/privacy</a></p>
        <p><strong>Data Processing Agreement:</strong> Google Cloud's GDPR-compliant Data Processing Amendment applies</p>

        <h3>4.2 External APIs (No Personal Data Shared)</h3>
        <p>The following services receive NO personal data:</p>
        <ul>
          <li><strong>REST Countries API:</strong> Provides country statistics (anonymous requests)</li>
          <li><strong>Currency API:</strong> Provides exchange rates (anonymous requests)</li>
        </ul>
      </section>

      <section>
        <h2>5. Your Rights Under GDPR</h2>
        <p>
          As a data subject in the European Union, you have the following rights:
        </p>

        <h3>5.1 Right of Access (Article 15)</h3>
        <p>
          You have the right to obtain confirmation whether we process your personal data and to
          access that data. You can view your data through the Settings page in the application.
        </p>

        <h3>5.2 Right to Rectification (Article 16)</h3>
        <p>
          You can update your username at any time through the Settings page.
        </p>

        <h3>5.3 Right to Erasure / "Right to be Forgotten" (Article 17)</h3>
        <p>
          You can request complete deletion of your account and all associated data by:
        </p>
        <ul>
          <li>Using the "Delete Account" button in Settings (requires re-authentication)</li>
          <li>Sending an email request to <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></li>
        </ul>
        <p>
          Upon deletion, all your data (User ID, username, scores, timestamps) will be permanently
          removed from Firebase Authentication and Cloud Firestore within 24 hours.
        </p>

        <h3>5.4 Right to Data Portability (Article 20)</h3>
        <p>
          You have the right to receive your personal data in a structured, commonly used, and
          machine-readable format (JSON). Contact <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a> to
          request a data export.
        </p>
      </section>

      <section>
        <h2>6. Contact Information</h2>
        <p>
          For any questions, concerns, or requests regarding this Privacy Policy or your personal data:
        </p>
        <div className="contact-info">
          <p><strong>Email:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></p>
          <p><strong>Data Controller:</strong> World Quiz Team</p>
          <p><strong>Response Time:</strong> Within 1 month</p>
        </div>
      </section>

      <section className="consent-section">
        <h2>7. Consent and Acceptance</h2>
        <p>
          By creating an account and using World Quiz, you acknowledge that you have read and
          understood this Privacy Policy and our <a href={buildLocalizedPath('/terms', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/terms', i18n.language)); }}>Terms & Conditions</a>, and you consent to:
        </p>
        <ul>
          <li>The collection and processing of your personal data as described above</li>
          <li>The use of Firebase (Google Ireland Limited) as a data processor</li>
          <li>The public display of your username and scores on leaderboards</li>
        </ul>
        <p>
          <strong>You may withdraw your consent at any time by deleting your account.</strong>
        </p>
      </section>

      <section className="related-section">
        <h2>Related Documents</h2>
        <p>
          Please also review our <a href={buildLocalizedPath('/terms', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/terms', i18n.language)); }}>Terms & Conditions</a> to understand the rules and guidelines for using World Quiz.
        </p>
      </section>
    </>
  );
}
