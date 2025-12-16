import { useNavigate } from 'react-router-dom';
import './TermsConditions.css';

export default function TermsConditions() {
  const navigate = useNavigate();

  return (
    <div className="terms-page">
      <div className="terms-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h1>Terms & Conditions</h1>
        <p className="last-updated">Last Updated: December 16, 2025</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using World Quiz ("the Service"), you accept and agree to be bound by these 
            Terms & Conditions. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2>2. Service Description</h2>
          <p>
            World Quiz is an educational geography quiz platform that provides:
          </p>
          <ul>
            <li>Interactive map-based geography quizzes</li>
            <li>Card matching games with country flags and shapes</li>
            <li>A comprehensive country encyclopedia with live data</li>
            <li>Global leaderboards and score tracking</li>
          </ul>
          <p>
            The Service is provided "as is" without warranties of any kind, either express or implied.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          
          <h3>3.1 Account Creation</h3>
          <p>To access certain features, you must create an account by providing:</p>
          <ul>
            <li>A valid email address</li>
            <li>A unique username (nickname)</li>
            <li>A secure password (for email/password registration)</li>
          </ul>
          <p>
            Alternatively, you may sign in using Google OAuth 2.0 authentication.
          </p>

          <h3>3.2 Account Responsibility</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
          </ul>

          <h3>3.3 Account Verification</h3>
          <p>
            Email/password accounts require email verification within 1 hour of registration. 
            Unverified accounts will be automatically deleted.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Use automated scripts or bots to manipulate scores or leaderboards</li>
            <li>Upload or transmit viruses, malware, or any other malicious code</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Impersonate any person or entity</li>
            <li>Use offensive or inappropriate usernames</li>
          </ul>
        </section>

        <section>
          <h2>5. Intellectual Property</h2>
          <p>
            All content, features, and functionality of World Quiz, including but not limited to 
            text, graphics, logos, icons, and software, are owned by the Service provider and are 
            protected by international copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            The Service is licensed under the MIT License for the open-source codebase. However, 
            the World Quiz brand, design, and user-generated content remain proprietary.
          </p>
        </section>

        <section>
          <h2>6. Leaderboards and User Content</h2>
          
          <h3>6.1 Score Tracking</h3>
          <p>
            By participating in games, your scores and username will be displayed on public leaderboards. 
            You consent to this public display by creating an account.
          </p>

          <h3>6.2 Score Integrity</h3>
          <p>
            We reserve the right to remove scores that we reasonably believe were obtained through 
            cheating, exploits, or automated means.
          </p>
        </section>

        <section>
          <h2>7. Service Availability</h2>
          <p>
            We strive to maintain continuous availability of the Service, but we do not guarantee:
          </p>
          <ul>
            <li>That the Service will be uninterrupted or error-free</li>
            <li>That defects will be corrected</li>
            <li>That the Service is free from viruses or other harmful components</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate the Service at any time without notice.
          </p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, World Quiz and its operators shall not be liable for:
          </p>
          <ul>
            <li>Any indirect, incidental, special, or consequential damages</li>
            <li>Loss of profits, data, or goodwill</li>
            <li>Service interruptions or data loss</li>
            <li>Actions of third-party services (Firebase, Google, API providers)</li>
          </ul>
        </section>

        <section>
          <h2>9. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, 
            if you breach these Terms & Conditions.
          </p>
          <p>
            You may terminate your account at any time through the Settings page. Upon termination, 
            all your data will be permanently deleted within 24 hours.
          </p>
        </section>

        <section>
          <h2>10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the 
            Czech Republic and the European Union, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms & Conditions at any time. Material changes 
            will be indicated by updating the "Last Updated" date at the top of this page. 
            Continued use of the Service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2>12. Contact Information</h2>
          <p>
            For any questions or concerns regarding these Terms & Conditions:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> <a href="mailto:privacy@world-quiz.com">privacy@world-quiz.com</a></p>
            <p><strong>Service Controller:</strong> World Quiz Team</p>
            <p><strong>Jurisdiction:</strong> Czech Republic, European Union</p>
          </div>
        </section>

        <section className="related-section">
          <h2>Related Documents</h2>
          <p>
            Please also review our <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Privacy Policy</a> to understand how we collect, use, and protect your personal data.
          </p>
        </section>
      </div>
    </div>
  );
}
