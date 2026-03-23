import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon } from './Icons';
import { buildLocalizedPath } from '../utils/localeRouting';
import './Auth.css';

export function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(buildLocalizedPath('/', i18n.language), { replace: true }); // Replace history so back can't return to login
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.loginToWorldQuiz')}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
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
          </div>          <div className="form-group">
            <label htmlFor="password">{t('auth.passwordLabel')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t('auth.loggingIn') : t('auth.login')}
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
          {t('auth.bySigningInAgree')} <Link to={buildLocalizedPath('/privacy', i18n.language)}>{t('auth.privacyPolicyAndTerms')}</Link>
        </p>

        <p className="auth-footer">
          {t('auth.noAccount')} <a href={buildLocalizedPath('/auth', i18n.language) + '?mode=register'}>{t('auth.signUpLink')}</a>
        </p>
      </div>
    </div>
  );
}
