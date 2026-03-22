import type { DistanceCategoryKey } from "../utils/guessCountryMath";
import "./GuessResultRow.css";

export type GuessResultRowData = {
  cca2: string;
  name: string;
  attemptNumber: number;
  isCorrect: boolean;
  continentHint: string;
  subregionHint: string;
  populationHint: string;
  areaHint: string;
  directionHint: string;
  distanceCategoryKey: DistanceCategoryKey;
  distanceKm: number;
};

type Translator = (key: string, vars?: Record<string, string | number>) => string;

interface GuessResultRowProps {
  row: GuessResultRowData;
  t: Translator;
}

function revealLevel(attemptNumber: number): number {
  if (attemptNumber <= 1) return 1;
  if (attemptNumber === 2) return 2;
  if (attemptNumber === 3) return 3;
  return 4;
}

export default function GuessResultRow({ row, t }: GuessResultRowProps) {
  const level = revealLevel(row.attemptNumber);

  return (
    <article className={`guess-row-card ${row.isCorrect ? "guess-row-card-correct" : ""}`}>
      <div className="guess-row-top">
        <strong>{row.name}</strong>
        <span>{t("game.guessLabel", { index: row.attemptNumber })}</span>
      </div>

      <div className="guess-row-chip-grid">
        <span className="guess-row-chip">
          {t("game.hints.continent")}: {row.continentHint}
        </span>
        <span className="guess-row-chip">
          {t("game.hints.subregion")}: {row.subregionHint}
        </span>

        <span className="guess-row-chip" title={t("game.tooltip.population")}> 
          {t("game.hints.population")}: {level >= 2 ? row.populationHint : t("game.locked")}
        </span>
        <span className="guess-row-chip" title={t("game.tooltip.area")}> 
          {t("game.hints.area")}: {level >= 2 ? row.areaHint : t("game.locked")}
        </span>

        <span className="guess-row-chip" title={t("game.tooltip.direction")}> 
          {t("game.hints.direction")}: {level >= 3 ? row.directionHint : t("game.locked")}
        </span>
        <span className="guess-row-chip">
          {t("game.hints.distanceCategory")}: {level >= 3 ? t(row.distanceCategoryKey) : t("game.locked")}
        </span>

        <span className="guess-row-chip guess-row-chip-wide">
          {t("game.hints.exactDistance")}: {level >= 4 ? t("game.km", { value: Math.round(row.distanceKm) }) : t("game.locked")}
        </span>
      </div>
    </article>
  );
}
