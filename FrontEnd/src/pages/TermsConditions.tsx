import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/BackButton';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrl, getSeoOgImage } from '../seo/seo-translations';
import { TermsEn } from './legal/TermsEn';
import { TermsCs } from './legal/TermsCs';
import { TermsDe } from './legal/TermsDe';
import './TermsConditions.css';

export default function TermsConditions() {
  const seo = SEO_TRANSLATIONS.routes.terms;
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language.split('-')[0];

  const renderContent = () => {
    switch (currentLanguage) {
      case 'cs':
        return <TermsCs />;
      case 'de':
        return <TermsDe />;
      default:
        return <TermsEn />;
    }
  };

  return (
    <>
      <SEOHelmet
        title={seo.title}
        description={seo.description}
        canonicalUrl={toCanonicalUrl(seo.path)}
        ogImage={getSeoOgImage(seo)}
      />
      <div className="terms-conditions-page">
        <div className="terms-conditions-container">
          <BackButton
            style={{
              position: 'relative',
              top: 'auto',
              left: 'auto',
              marginBottom: '24px',
            }}
            onClick={() => navigate(-1)}
          />
          {renderContent()}
        </div>
      </div>
    </>
  );
}
