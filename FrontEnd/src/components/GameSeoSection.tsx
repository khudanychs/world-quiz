import { useEffect, useRef, useState } from "react";
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
}

export function GameSeoSection({ guideKey, relatedLinks }: GameSeoSectionProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = getBaseLanguage(i18n.language);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Close the popover when clicking/tapping anywhere outside the disclosure.
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsidePointer = (event: PointerEvent) => {
      const node = detailsRef.current;
      if (node && event.target instanceof Node && !node.contains(event.target)) {
        node.open = false;
      }
    };
    document.addEventListener("pointerdown", handleOutsidePointer, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer, true);
  }, [isOpen]);

  // Collapse automatically after navigating to another mode via a related link.
  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [guideKey]);

  const heading = t(`seo.guides.${guideKey}.heading`);
  const summary = t(`seo.guides.${guideKey}.summary`);
  const infoButtonLabel = t("seo.guides.common.infoButton");
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
    <aside className="game-seo-anchor" aria-label={heading} lang={currentLanguage}>
      {/* Fixed corner disclosure keeps full-screen map games scroll-free while preserving semantic guide HTML. */}
      <details
        ref={detailsRef}
        className="game-seo-details"
        onToggle={(event) => setIsOpen(event.currentTarget.open)}
      >
        <summary className="game-seo-fab" aria-label={heading}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="game-seo-fab-label">{infoButtonLabel}</span>
        </summary>

        <div className="game-seo-panel">
          <div className="game-seo-inner">
            <h2 className="game-seo-heading">{heading}</h2>
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
        </div>
      </details>
    </aside>
  );
}
