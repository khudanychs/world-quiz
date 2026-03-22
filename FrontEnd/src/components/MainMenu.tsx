import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from './SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrl, getSeoOgImage } from '../seo/seo-translations';
import './MainMenu.css';

export default function MainMenu() {
  const { t } = useTranslation();
  const seo = SEO_TRANSLATIONS.routes.home;
  const navigate = useNavigate();
  const canonicalHome = toCanonicalUrl(seo.path);
  const homeStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "World Quiz",
    url: canonicalHome,
    description: seo.description,
    inLanguage: "en",
  };

  return (
    <>
      <SEOHelmet
        title={seo.title}
        description={seo.description}
        canonicalUrl={canonicalHome}
        ogImage={getSeoOgImage(seo)}
        structuredData={homeStructuredData}
      />
      <div className="menu-wrap">
        <header className="menu-header">
          <h2>{t('mainMenu.title')}</h2>
          <p>{t('mainMenu.subtitle')}</p>
        </header>

      <section className="menu-grid">
        <button className="menu-card" onClick={() => navigate('/game/physical-geo')}>
          <div className="menu-card-body">
            <h3>{t('mainMenu.games.physicalGeo.title')}</h3>
            <p>{t('mainMenu.games.physicalGeo.description')}</p>
            <span className="menu-tag" style={{background:'#f59e0b'}}>{t('mainMenu.games.physicalGeo.tag')}</span>
          </div>
        </button>
        <button className="menu-card" onClick={() => navigate('/game/flags')}>
          <div className="menu-card-body">
            <h3>{t('mainMenu.games.flags.title')}</h3>
            <p>{t('mainMenu.games.flags.description')}</p>
          </div>
        </button>
        <button className="menu-card" onClick={() => navigate('/game/shape-match')}>
          <div className="menu-card-body">
            <h3>{t('mainMenu.games.shapeMatch.title')}</h3>
            <p>{t('mainMenu.games.shapeMatch.description')}</p>
          </div>
        </button>
        <button className="menu-card" onClick={() => navigate('/game/guess-country')}>
          <div className="menu-card-body">
            <h3>{t('mainMenu.games.guessCountry.title')}</h3>
            <p>{t('mainMenu.games.guessCountry.description')}</p>
            <span className="menu-tag" style={{background:'#0ea5e9'}}>{t('mainMenu.games.guessCountry.tag')}</span>
          </div>
        </button>
      </section>

        <footer className="menu-footer">
          <button className="menu-primary" onClick={() => navigate('/map')}>
            {t('mainMenu.exploreMap')}
          </button>
        </footer>
      </div>
    </>
  );
}
