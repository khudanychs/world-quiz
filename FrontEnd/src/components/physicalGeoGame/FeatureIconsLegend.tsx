import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { FeatureCategory } from "../../utils/physicalFeaturesTypes";
import { FeatureTypeIcon } from "./FeatureTypeIcon";
import "./FeatureIconsLegend.css";

const LEGEND_ORDER: readonly FeatureCategory[] = [
  "mountain",
  "mountain_range",
  "volcano",
  "depression",
  "desert",
  "lake",
  "river",
  "ocean",
  "sea",
  "gulf",
  "bay",
  "strait",
  "canal",
  "channel",
  "passage",
];

/**
 * Info ("i") trigger + native modal <dialog> showing a localized, responsive
 * legend of all 15 cartographic icons used in Physical Geography.
 */
export function FeatureIconsLegend() {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const subtitleId = useId();

  // Safari fallback for declarative closedby="any" light-dismiss:
  // requires both pointerdown and pointerup outside the dialog box so text-selection
  // drags ending on the backdrop do not accidentally close the modal.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof HTMLDialogElement === "undefined" || "closedBy" in HTMLDialogElement.prototype) {
      return;
    }

    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    let pressedOutside = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const openLegend = () => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  };

  return (
    <>
      <button
        type="button"
        className="phys-legend-trigger"
        onClick={openLegend}
        aria-label={t("physicalGeoGame.iconLegend.buttonLabel")}
        title={t("physicalGeoGame.iconLegend.buttonLabel")}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 16v-4.5" />
          <circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        className="phys-legend-dialog"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        {...({ closedby: "any" } as Record<string, string>)}
      >
        <div className="phys-legend-header">
          <div className="phys-legend-headings">
            <h2 id={titleId} className="phys-legend-title">
              {t("physicalGeoGame.iconLegend.title")}
            </h2>
            <p id={subtitleId} className="phys-legend-subtitle">
              {t("physicalGeoGame.iconLegend.subtitle")}
            </p>
          </div>
          <form method="dialog" className="phys-legend-close-form">
            <button
              type="submit"
              className="phys-legend-close"
              aria-label={t("physicalGeoGame.iconLegend.close")}
              autoFocus
            >
              ✕
            </button>
          </form>
        </div>

        <ul className="phys-legend-grid">
          {LEGEND_ORDER.map((type) => (
            <li key={type} className="phys-legend-card">
              <span className="phys-legend-icon" aria-hidden="true">
                <FeatureTypeIcon type={type} />
              </span>
              <span className="phys-legend-name">
                {t(`physicalGeoHUD.featureTypes.${type}`)}
              </span>
              <span className="phys-legend-desc">
                {t(`physicalGeoGame.iconLegend.descriptions.${type}`)}
              </span>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
