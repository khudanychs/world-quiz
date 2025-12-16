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
            <p><strong>Contact Email:</strong> <a href="mailto:privacy@world-quiz.com">privacy@world-quiz.com</a></p>
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
          <h2>5. Data Minimization</h2>
          <p>
            In accordance with Article 5(1)(c) GDPR, we collect only the minimum data necessary:
          </p>
          <ul>
            <li><strong>Email Address:</strong> Stored only in Firebase Authentication, NOT duplicated in Firestore 
            unless absolutely necessary for functionality</li>
            <li><strong>Profile Picture:</strong> Displayed transiently during session; never saved to any database</li>
            <li><strong>Google OAuth Scopes:</strong> We request only <code>openid</code> and <code>email</code> scopes. 
            We do NOT request access to your Google Drive, Contacts, or other services.</li>
          </ul>
        </section>

        <section>
          <h2>6. Your Rights Under GDPR</h2>
          <p>
            As a data subject in the European Union, you have the following rights:
          </p>

          <h3>6.1 Right of Access (Article 15)</h3>
          <p>
            You have the right to obtain confirmation whether we process your personal data and to 
            access that data. You can view your data through the Settings page in the application.
          </p>

          <h3>6.2 Right to Rectification (Article 16)</h3>
          <p>
            You can update your username at any time through the Settings page.
          </p>

          <h3>6.3 Right to Erasure / "Right to be Forgotten" (Article 17)</h3>
          <p>
            You can request complete deletion of your account and all associated data by:
          </p>
          <ul>
            <li>Using the "Delete Account" button in Settings (requires re-authentication)</li>
            <li>Sending an email request to <a href="mailto:privacy@world-quiz.com">privacy@world-quiz.com</a></li>
          </ul>
          <p>
            Upon deletion, all your data (User ID, username, scores, timestamps) will be permanently 
            removed from Firebase Authentication and Cloud Firestore within 24 hours.
          </p>

          <h3>6.4 Right to Data Portability (Article 20)</h3>
          <p>
            You have the right to receive your personal data in a structured, commonly used, and 
            machine-readable format (JSON). Contact <a href="mailto:privacy@world-quiz.com">privacy@world-quiz.com</a> to 
            request a data export.
          </p>

          <h3>6.5 Right to Object (Article 21)</h3>
          <p>
            You may object to the processing of your data based on legitimate interest. However, 
            this may result in the inability to use certain features of the Service.
          </p>

          <h3>6.6 Right to Lodge a Complaint</h3>
          <p>
            If you believe we are not processing your data in compliance with GDPR, you have the 
            right to lodge a complaint with the supervisory authority:
          </p>
          <div className="authority-info">
            <p><strong>Czech Republic:</strong></p>
            <p>Úřad pro ochranu osobních údajů (ÚOOÚ)</p>
            <p>Website: <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer">uoou.cz</a></p>
            <p>Email: posta@uoou.cz</p>
          </div>

          <h3>6.7 Exercising Your Rights</h3>
          <p>
            To exercise any of these rights, please contact us at: 
            <a href="mailto:privacy@world-quiz.com"> privacy@world-quiz.com</a>
          </p>
          <p>
            We will respond to your request within 1 month as required by Article 12(3) GDPR.
          </p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>We retain your data as follows:</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data Category</th>
                <th>Retention Period</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Active Account Data</td>
                <td>While account is active</td>
                <td>Provide ongoing service</td>
              </tr>
              <tr>
                <td>Unverified Email Accounts</td>
                <td>1 hour after registration</td>
                <td>Automatic cleanup</td>
              </tr>
              <tr>
                <td>Deleted Account Data</td>
                <td>Permanently deleted within 24 hours</td>
                <td>GDPR compliance</td>
              </tr>
              <tr>
                <td>Session Tokens</td>
                <td>Cleared on logout</td>
                <td>Security</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>8. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your data:
          </p>
          <ul>
            <li><strong>Encryption in Transit:</strong> All data transmitted via HTTPS/TLS</li>
            <li><strong>Encryption at Rest:</strong> All data stored in Firebase is encrypted by Google Cloud</li>
            <li><strong>Access Control:</strong> Firestore Security Rules prevent unauthorized access</li>
            <li><strong>Authentication Security:</strong> Passwords are hashed using industry-standard algorithms (bcrypt)</li>
            <li><strong>Regular Updates:</strong> We keep all dependencies and Firebase SDKs up to date</li>
          </ul>
          <p>
            However, no method of transmission over the Internet is 100% secure. We cannot guarantee 
            absolute security.
          </p>
        </section>

        <section>
          <h2>9. International Data Transfers</h2>
          <p>
            Your data is processed within the European Economic Area (EEA) using Google Cloud's 
            EU data centers. Google Ireland Limited complies with GDPR and provides adequate 
            safeguards for data protection.
          </p>
        </section>

        <section>
          <h2>10. Children's Privacy</h2>
          <p>
            Our Service is not directed to children under 13 years of age. We do not knowingly 
            collect personal data from children under 13.
          </p>
          <p>
            If you are a parent or guardian and believe your child has provided us with personal 
            information, please contact us at <a href="mailto:privacy@world-quiz.com">privacy@world-quiz.com</a>. 
            We will delete such information immediately.
          </p>
        </section>

        <section>
          <h2>11. Automated Decision-Making</h2>
          <p>
            We do NOT use automated decision-making or profiling as defined in Article 22 GDPR.
          </p>
        </section>

        <section>
          <h2>12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices 
            or for legal, regulatory, or operational reasons.
          </p>
          <p>
            Material changes will be communicated by:
          </p>
          <ul>
            <li>Updating the "Last Updated" date at the top of this page</li>
            <li>Displaying a prominent notice in the application (for significant changes)</li>
          </ul>
          <p>
            We encourage you to review this Privacy Policy periodically.
          </p>
        </section>

        <section>
          <h2>13. Contact Information</h2>
          <p>
            For any questions, concerns, or requests regarding this Privacy Policy or your personal data:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> <a href="mailto:privacy@world-quiz.com">privacy@world-quiz.com</a></p>
            <p><strong>Data Controller:</strong> World Quiz Team</p>
            <p><strong>Response Time:</strong> Within 1 month </p>
          </div>
        </section>

        <section className="consent-section">
          <h2>14. Consent and Acceptance</h2>
          <p>
            By creating an account and using World Quiz, you acknowledge that you have read and 
            understood this Privacy Policy and our <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms & Conditions</a>, and you consent to:
          </p>
          <ul>
            <li>The collection and processing of your personal data as described above</li>
            <li>The use of Firebase (Google Ireland Limited) as a data processor</li>
            <li>The public display of your username and scores on leaderboards</li>
          </ul>
          <p>
            If you use Google Sign-In, you additionally consent to Google sharing your User ID, 
            email address, and name with our Service through OAuth 2.0.
          </p>
          <p>
            <strong>You may withdraw your consent at any time by deleting your account.</strong>
          </p>
        </section>

        <section className="related-section">
          <h2>Related Documents</h2>
          <p>
            Please also review our <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms & Conditions</a> to understand the rules and guidelines for using World Quiz.
          </p>
        </section>
      </div>
    </div>
  );
}
