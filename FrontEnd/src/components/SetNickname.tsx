import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { SEOHelmet } from './SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrl, getSeoOgImage } from '../seo/seo-translations';
import { buildLocalizedPath } from '../utils/localeRouting';
import './Auth.css';

export const SetNickname = () => {
  const seo = SEO_TRANSLATIONS.routes.setNickname;
  const { t, i18n } = useTranslation();
  const { user, setNickname } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Pre-fill with Google display name or username
    if (user) {
      setUsername(user.displayName || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await setNickname(username);
      navigate(buildLocalizedPath('/', i18n.language), { replace: true }); // Replace history to avoid back to nickname
    } catch (err: any) {
      setError(err.message || t('setNickname.errors.failedToSet'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHelmet
        title={seo.title}
        description={seo.description}
        canonicalUrl={toCanonicalUrl(seo.path)}
        ogImage={getSeoOgImage(seo)}
        noindex={seo.noindex}
      />
      <div className="auth-container">
        <div className="auth-card">
        <h2>{t('setNickname.title')}</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px', fontSize: '14px' }}>
          {t('setNickname.subtitle')}
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t('setNickname.usernameLabel')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('setNickname.usernamePlaceholder')}
              required
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9_\-]+"
              title={t('setNickname.usernameTitle')}
            />
            <small>{t('setNickname.usernameHelp')}</small>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading || username.length < 3}
          >
            {loading ? t('setNickname.setting') : t('setNickname.continueToGame')}
          </button>
        </form>
        </div>
      </div>
    </>
  );
};
