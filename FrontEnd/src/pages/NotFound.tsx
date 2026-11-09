import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrlWithLanguage, getSeoOgImage } from '../seo/seo-translations';
import { buildLocalizedPath, getBaseLanguage } from '../utils/localeRouting';
import './NotFound.css';

export default function NotFound() {
  const { t, i18n } = useTranslation();
  const currentLanguage = getBaseLanguage(i18n.language);
  const seo = SEO_TRANSLATIONS.routes.notFound;

  return (
    <>
      <SEOHelmet
        title={seo.title}
        description={seo.description}
        canonicalUrl={toCanonicalUrlWithLanguage(seo.path, currentLanguage)}
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
            <Link className="not-found-button primary" to={buildLocalizedPath('/', currentLanguage)}>
              {t('notFound.goHome')}
            </Link>
            <Link className="not-found-button" to={buildLocalizedPath('/countries', currentLanguage)}>
              {t('notFound.browseCountries')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
