import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/BackButton';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrlWithLanguage, getSeoOgImage } from '../seo/seo-translations';
import { getBaseLanguage } from '../utils/localeRouting';
import { PrivacyEn } from './legal/PrivacyEn';
import { PrivacyCs } from './legal/PrivacyCs';
import { PrivacyDe } from './legal/PrivacyDe';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  const seo = SEO_TRANSLATIONS.routes.privacy;
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const currentLanguage = getBaseLanguage(i18n.language);

  const renderContent = () => {
    switch (currentLanguage) {
      case 'cs':
        return <PrivacyCs />;
      case 'de':
        return <PrivacyDe />;
      default:
        return <PrivacyEn />;
    }
  };

  return (
    <>
      <SEOHelmet
        title={seo.title}
        description={seo.description}
        canonicalUrl={toCanonicalUrlWithLanguage(seo.path, currentLanguage)}
        ogImage={getSeoOgImage(seo)}
      />
      <div className="privacy-policy-page">
        <div className="privacy-policy-container">
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
