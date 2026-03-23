import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon } from './Icons';
import { buildLocalizedPath } from '../utils/localeRouting';
import './Auth.css';

export function Register() {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.errors.passwordMinLength'));
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError(t('auth.errors.passwordComplexity'));
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      setSuccess(t('auth.messages.registrationSuccess'));
      setError('');
    } catch (err: any) {
      setError(err.message);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.createAccountTitle')}</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t('auth.usernameLabel')}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              placeholder={t('auth.usernamePlaceholder')}
              pattern="[a-zA-Z0-9_\-]+"
              title={t('auth.usernameTitle')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('auth.emailLabel')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.passwordLabel')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
            />
            <small>{t('auth.passwordHelp')}</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPasswordLabel')}</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t('auth.creatingAccount') : t('auth.signUp')}
          </button>
        </form>

        <div className="divider">
          <span>{t('auth.or')}</span>
        </div>

        <button onClick={loginWithGoogle} className="btn-google">
          <GoogleIcon />
          {t('auth.continueWithGoogle')}
        </button>

        <p className="privacy-consent">
          {t('auth.privacyConsentPrefix')} <Link to={buildLocalizedPath('/privacy', i18n.language)}>{t('auth.privacyPolicyAndTerms')}</Link>
        </p>

        <p className="auth-footer">
          {t('auth.alreadyHaveAccount')} <a href={buildLocalizedPath('/auth', i18n.language) + '?mode=login'}>{t('auth.logInLink')}</a>
        </p>
      </div>
    </div>
  );
}
