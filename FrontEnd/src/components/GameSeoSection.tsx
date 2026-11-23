import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buildLocalizedPath, getBaseLanguage } from "../utils/localeRouting";
import "./GameSeoSection.css";

export type GameGuideKey =
  | "flagMatch"
  | "flagMatchWorld"
  | "flagMatchEurope"
  | "flagMatchAsia"
  | "flagMatchAfrica"
  | "flagMatchAmericas"
  | "flagMatchOceania"
  | "physicalGeo"
  | "physicalGeoMountains"
  | "physicalGeoRivers"
  | "physicalGeoDeserts"
  | "physicalGeoWaters"
  | "guessCountry"
  | "worldMap";

export interface RelatedLinkItem {
  path: string;
  label: string;
}

interface GameSeoSectionProps {
  guideKey: GameGuideKey;
  relatedLinks: RelatedLinkItem[];
  defaultOpen?: boolean;
}

export function GameSeoSection({
  guideKey,
  relatedLinks,
  defaultOpen = false,
}: GameSeoSectionProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = getBaseLanguage(i18n.language);

  const heading = t(`seo.guides.${guideKey}.heading`);
  const summary = t(`seo.guides.${guideKey}.summary`);
  const rulesTitle = t("seo.guides.common.rulesTitle");
  const scopeTitle = t("seo.guides.common.scopeTitle");
  const relatedTitle = t("seo.guides.common.relatedTitle");
  const scope = t(`seo.guides.${guideKey}.scope`);
  const rules = [
    t(`seo.guides.${guideKey}.rule1`),
    t(`seo.guides.${guideKey}.rule2`),
    t(`seo.guides.${guideKey}.rule3`),
  ];

  return (
    <section className="game-seo-section" aria-label={heading} lang={currentLanguage}>
      {/* Native disclosure keeps active map viewports compact while exposing full guide content in HTML. */}
      <details className="game-seo-details" open={defaultOpen}>
        <summary className="game-seo-toggle">
          <span className="game-seo-toggle-title">{heading}</span>
          <span className="game-seo-toggle-chevron" aria-hidden="true">▾</span>
        </summary>

        <div className="game-seo-inner">
          <p className="game-seo-summary">{summary}</p>

          <div className="game-seo-grid">
            <div className="game-seo-card">
              <h3>{rulesTitle}</h3>
              <ul className="game-seo-rules">
                {rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>

            <div className="game-seo-card">
              <h3>{scopeTitle}</h3>
              <p>{scope}</p>
            </div>
          </div>

          {relatedLinks.length > 0 && (
            <nav className="game-seo-related" aria-label={relatedTitle}>
              <span className="game-seo-related-label">{relatedTitle}</span>
              <div className="game-seo-links">
                {relatedLinks.map((item) => (
                  <Link
                    key={item.path}
                    className="game-seo-link"
                    to={buildLocalizedPath(item.path, currentLanguage)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </details>
    </section>
  );
}
