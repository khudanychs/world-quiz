import { useNavigate } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrl, getSeoOgImage } from '../seo/seo-translations';
import './NotFound.css';

export default function NotFound() {
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
          <h1 id="not-found-title">Page Not Found</h1>
          <p className="not-found-text">
            The page you are looking for does not exist or was moved.
          </p>
          <div className="not-found-actions">
            <button className="not-found-button primary" onClick={() => navigate('/')}>
              Go to Home
            </button>
            <button className="not-found-button" onClick={() => navigate('/countries')}>
              Browse Countries
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
