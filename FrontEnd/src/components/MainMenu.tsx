import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from './SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrlWithLanguage, getSeoOgImage } from '../seo/seo-translations';
import { buildLocalizedPath, getBaseLanguage } from '../utils/localeRouting';
import './MainMenu.css';

export default function MainMenu() {
  const { t, i18n } = useTranslation();
  const seoH1 = t('seo.h1.mainMenu');
  const seo = SEO_TRANSLATIONS.routes.home;
  const currentLanguage = getBaseLanguage(i18n.language);
  const bangUrl = currentLanguage === 'cs' ? 'https://bang.honzaa.cz/cs' : 'https://bang.honzaa.cz/en';
  const canonicalHome = toCanonicalUrlWithLanguage(seo.path, currentLanguage);
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
      <h1 className="sr-only">{seoH1}</h1>
      <div className="menu-wrap">
        <header className="menu-header">
          <h2>{t('mainMenu.title')}</h2>
          <p>{t('mainMenu.subtitle')}</p>
        </header>

      <section className="menu-grid">
        <Link className="menu-card" to={buildLocalizedPath('/game/physical-geo', currentLanguage)}>
          <div className="menu-card-body">
            <h3>{t('mainMenu.games.physicalGeo.title')}</h3>
            <p>{t('mainMenu.games.physicalGeo.description')}</p>
            <span className="menu-tag" style={{background:'#f59e0b'}}>{t('mainMenu.games.physicalGeo.tag')}</span>
          </div>
        </Link>
        <Link className="menu-card" to={buildLocalizedPath('/game/flags', currentLanguage)}>
          <div className="menu-card-body">
            <h3>{t('mainMenu.games.flags.title')}</h3>
            <p>{t('mainMenu.games.flags.description')}</p>
          </div>
        </Link>
        <Link className="menu-card" to={buildLocalizedPath('/game/shape-match', currentLanguage)}>
          <div className="menu-card-body">
            <h3>{t('mainMenu.games.shapeMatch.title')}</h3>
            <p>{t('mainMenu.games.shapeMatch.description')}</p>
          </div>
        </Link>
        <Link className="menu-card" to={buildLocalizedPath('/game/guess-country', currentLanguage)}>
          <div className="menu-card-body">
            <h3>{t('mainMenu.games.guessCountry.title')}</h3>
            <p>{t('mainMenu.games.guessCountry.description')}</p>
            <span className="menu-tag" style={{background:'#0ea5e9'}}>{t('mainMenu.games.guessCountry.tag')}</span>
          </div>
        </Link>
        <a 
          href={bangUrl} 
          target="_blank" 
          rel="noopener"
          className="menu-card partner"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="menu-card-body">
            <h3>{t('mainMenu.games.bangOnline.title')} ↗</h3>
            <p>{t('mainMenu.games.bangOnline.description')}</p>
            <span className="menu-tag" style={{background:'#8b5cf6'}}>{t('mainMenu.games.bangOnline.tag')}</span>
          </div>
        </a>
        <a
          href="https://jef.world-quiz.com/"
          target="_blank"
          rel="noopener"
          className="menu-card flag-database"
        >
          <div className="menu-card-body">
            <h3>{t('mainMenu.games.flagDatabase.title')} ↗</h3>
            <p>{t('mainMenu.games.flagDatabase.description')}</p>
            <span className="menu-tag">{t('mainMenu.games.flagDatabase.tag')}</span>
          </div>
        </a>
      </section>

        <footer className="menu-footer">
          <Link className="menu-primary" to={buildLocalizedPath('/map', currentLanguage)}>
            {t('mainMenu.exploreMap')}
          </Link>
        </footer>
      </div>
    </>
  );
}
