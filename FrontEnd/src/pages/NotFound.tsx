import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrl, getSeoOgImage } from '../seo/seo-translations';
import { buildLocalizedPath } from '../utils/localeRouting';
import './NotFound.css';

export default function NotFound() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const seo = SEO_TRANSLATIONS.routes.notFound;

  return (
    <>
      <SEOHelmet
        title={seo.title}
        description={seo.description}
        canonicalUrl={toCanonicalUrl(seo.path)}
        ogImage={getSeoOgImage(seo)}
        noindex={seo.noindex}
      />
      <main className="not-found-page" role="main" aria-labelledby="not-found-title">
        <section className="not-found-card">
          <p className="not-found-code">404</p>
          <h1 id="not-found-title">{t('notFound.title')}</h1>
          <p className="not-found-text">
            {t('notFound.message')}
          </p>
          <div className="not-found-actions">
            <button className="not-found-button primary" onClick={() => navigate(buildLocalizedPath('/', i18n.language))}>
              {t('notFound.goHome')}
            </button>
            <button className="not-found-button" onClick={() => navigate(buildLocalizedPath('/countries', i18n.language))}>
              {t('notFound.browseCountries')}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
