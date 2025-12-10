import { useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="privacy-policy-page">
      <div className="privacy-policy-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h1>Privacy Policy & Terms of Service</h1>
        <p className="last-updated">Last Updated: December 10, 2025</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to World Quiz. This Privacy Policy explains how we collect, use, and protect your 
            information when you use our geography quiz application.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li><strong>Email address</strong> - For account authentication and verification</li>
            <li><strong>Username</strong> - For displaying on leaderboards and game sessions</li>
            <li><strong>Password</strong> - Securely hashed and stored by Firebase Authentication</li>
          </ul>

          <h3>2.2 Google Sign-In</h3>
          <p>When you use "Continue with Google", we collect:</p>
          <ul>
            <li><strong>Email address</strong> - From your Google account</li>
            <li><strong>Name</strong> - Used to create your initial username</li>
            <li><strong>Profile picture</strong> - Not stored, only displayed during session</li>
          </ul>
          <p>
            We use Google OAuth 2.0 for authentication. Your Google credentials are never stored on our servers.
          </p>

          <h3>2.3 Game Data</h3>
          <p>We automatically collect:</p>
          <ul>
            <li><strong>Game scores and streaks</strong> - To display on leaderboards</li>
            <li><strong>Play history</strong> - Daily and all-time best scores</li>
            <li><strong>Timestamps</strong> - When games are played</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Authenticate and manage your account</li>
            <li>Display your username on leaderboards</li>
            <li>Track your game progress and achievements</li>
            <li>Send email verification (required for email/password accounts)</li>
            <li>Improve our services and user experience</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Storage & Security</h2>
          <p>
            We use <strong>Google Firebase</strong> services to store and manage data:
          </p>
          <ul>
            <li><strong>Firebase Authentication</strong> - Securely manages user credentials</li>
            <li><strong>Cloud Firestore</strong> - Stores usernames, scores, and leaderboard data</li>
          </ul>
          <p>
            Your data is protected by industry-standard security measures including encryption in transit 
            and at rest. We implement Firestore security rules to prevent unauthorized access.
          </p>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          
          <h3>5.1 Firebase (Google)</h3>
          <ul>
            <li>Authentication and data storage</li>
            <li>Privacy Policy: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">Firebase Privacy</a></li>
          </ul>

          <h3>5.2 REST Countries API</h3>
          <ul>
            <li>Provides country statistics (population, area, etc.)</li>
            <li>No personal data is sent to this service</li>
          </ul>

          <h3>5.3 Currency API</h3>
          <ul>
            <li>Provides live exchange rates</li>
            <li>No personal data is sent to this service</li>
          </ul>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access your data</strong> - View your account information and game history</li>
            <li><strong>Update your data</strong> - Change your username through Settings</li>
            <li><strong>Delete your account</strong> - Permanently delete all your data (requires re-authentication)</li>
            <li><strong>Opt-out</strong> - Play as a guest without creating an account (scores won't be saved)</li>
          </ul>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <ul>
            <li><strong>Active accounts</strong> - Data retained indefinitely while account is active</li>
            <li><strong>Unverified accounts</strong> - Automatically deleted after 1 hour if email not verified</li>
            <li><strong>Deleted accounts</strong> - All data permanently deleted within 24 hours</li>
          </ul>
        </section>

        <section>
          <h2>8. Cookies & Local Storage</h2>
          <p>
            We use browser local storage to:
          </p>
          <ul>
            <li>Maintain your login session</li>
            <li>Cache leaderboard data to reduce server requests</li>
            <li>Remember your preferences</li>
          </ul>
          <p>
            No third-party tracking cookies are used.
          </p>
        </section>

        <section>
          <h2>9. Children's Privacy</h2>
          <p>
            Our service is not directed to children under 13. We do not knowingly collect personal 
            information from children under 13. If you are a parent or guardian and believe your child 
            has provided us with personal information, please contact us.
          </p>
        </section>

        <section>
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of any material 
            changes by updating the "Last Updated" date at the top of this page.
          </p>
        </section>

        <section>
          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a>
          </p>
        </section>

        <section className="consent-section">
          <h2>12. Consent</h2>
          <p>
            By using World Quiz and creating an account, you consent to the collection and use of your 
            information as described in this Privacy Policy. If you sign in with Google, you also 
            consent to Google sharing your basic profile information with us as described in section 2.2.
          </p>
        </section>
      </div>
    </div>
  );
}
